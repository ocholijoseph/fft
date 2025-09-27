import { Router } from 'express';
import { prisma } from '../services/prisma';
import { requireAuth, requireRole } from '../services/auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
export const router = Router();
// Dashboard endpoints
router.get('/dashboard/summary', requireAuth, async (req, res) => {
    const { userId, role } = req.auth;
    const where = role === 'CHILD' ? { userId } : {};
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startThisMonthNext = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastMonth = await prisma.expense.aggregate({ _sum: { amount: true }, where: { ...where, createdAt: { gte: startLastMonth, lt: startThisMonth } } });
    const thisMonth = await prisma.expense.aggregate({ _sum: { amount: true }, where: { ...where, createdAt: { gte: startThisMonth, lt: startThisMonthNext } } });
    res.json({ monthTotal: thisMonth._sum.amount || 0, lastMonthTotal: lastMonth._sum.amount || 0 });
});
router.get('/dashboard/categories', requireAuth, async (req, res) => {
    const { userId, role } = req.auth;
    const where = role === 'CHILD' ? { userId } : {};
    const items = await prisma.expense.groupBy({ by: ['category'], _sum: { amount: true }, where });
    res.json(items.map(i => ({ name: i.category, value: i._sum.amount || 0 })));
});
router.get('/dashboard/trend', requireAuth, async (req, res) => {
    const { userId, role } = req.auth;
    const where = role === 'CHILD' ? { userId } : {};
    const items = await prisma.$queryRaw `
    SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month,
           COALESCE(SUM("amount"),0)::float as total
    FROM "Expense"
    WHERE ${role === 'CHILD' ? Prisma.sql `"userId" = ${userId}` : Prisma.sql `1=1`}
    GROUP BY 1
    ORDER BY 1 ASC
  `;
    res.json(items.map(i => ({ date: i.month, total: i.total })));
});
// Expense CRUD with role scopes
const expenseSchema = z.object({
    amount: z.number().positive(),
    category: z.string(),
    description: z.string().optional(),
    createdAt: z.string().datetime().optional()
});
router.get('/expenses', requireAuth, async (req, res) => {
    const { userId, role } = req.auth;
    const where = role === 'CHILD' ? { userId } : {};
    const items = await prisma.expense.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    res.json(items);
});
router.post('/expenses', requireAuth, async (req, res) => {
    const { userId, role } = req.auth;
    const parsed = expenseSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const ownerId = role === 'CHILD' ? userId : (req.body.userId || userId);
    if (role === 'CHILD' && ownerId !== userId)
        return res.status(403).json({ error: 'Forbidden' });
    const expense = await prisma.expense.create({ data: { ...parsed.data, userId: ownerId } });
    res.status(201).json(expense);
});
router.put('/expenses/:id', requireAuth, async (req, res) => {
    const { userId, role } = req.auth;
    const id = String(req.params.id);
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing)
        return res.status(404).json({ error: 'Not found' });
    if (role === 'CHILD' && existing.userId !== userId)
        return res.status(403).json({ error: 'Forbidden' });
    const parsed = expenseSchema.partial().safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const updated = await prisma.expense.update({ where: { id }, data: parsed.data });
    res.json(updated);
});
router.delete('/expenses/:id', requireAuth, async (req, res) => {
    const { userId, role } = req.auth;
    const id = String(req.params.id);
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing)
        return res.status(404).json({ error: 'Not found' });
    if (role === 'CHILD' && existing.userId !== userId)
        return res.status(403).json({ error: 'Forbidden' });
    await prisma.expense.delete({ where: { id } });
    res.json({ ok: true });
});
// Budgets (Father only)
const budgetSchema = z.object({ category: z.string(), limit: z.number().positive() });
router.get('/budgets', requireAuth, async (_req, res) => {
    const items = await prisma.budget.findMany({ orderBy: { category: 'asc' } });
    res.json(items);
});
router.post('/budgets', requireRole(['FATHER']), async (req, res) => {
    const parsed = budgetSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const created = await prisma.budget.create({ data: parsed.data });
    res.status(201).json(created);
});
router.put('/budgets/:id', requireRole(['FATHER']), async (req, res) => {
    const id = String(req.params.id);
    const parsed = budgetSchema.partial().safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const updated = await prisma.budget.update({ where: { id }, data: parsed.data });
    res.json(updated);
});
// AI Insights
router.get('/insights/tip', requireAuth, async (req, res) => {
    const { role } = req.auth;
    try {
        // Placeholder: could call OpenAI here
        const tip = role === 'CHILD'
            ? 'Try setting aside a small weekly savings from allowance.'
            : 'Reducing restaurant spending by one meal per week could save $150/month.';
        res.json({ message: tip });
    }
    catch (e) {
        res.json({ message: 'Analyzing your spending patterns...' });
    }
});
