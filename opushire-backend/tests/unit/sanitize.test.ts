import { Request, Response, NextFunction } from 'express';
import { mongoSanitize } from '../../src/middleware/sanitize';

describe('mongoSanitize middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockReq = { body: {}, params: {} as any, query: {} };
        mockRes = {};
        mockNext = jest.fn();
    });

    it('strips keys starting with $ from req.body', () => {
        mockReq.body = { username: 'john', $gt: '' };
        mongoSanitize(mockReq as Request, mockRes as Response, mockNext);
        expect(mockReq.body).toEqual({ username: 'john' });
        expect(mockNext).toHaveBeenCalled();
    });

    it('strips $ne operator from nested objects', () => {
        mockReq.body = { password: { $ne: '' } };
        mongoSanitize(mockReq as Request, mockRes as Response, mockNext);
        expect(mockReq.body).toEqual({ password: {} });
    });

    it('strips $where key', () => {
        mockReq.body = { $where: 'this.isAdmin === true' };
        mongoSanitize(mockReq as Request, mockRes as Response, mockNext);
        expect(mockReq.body).toEqual({});
    });

    it('strips keys containing dots (path injection)', () => {
        mockReq.body = { 'user.password': 'hack', name: 'ok' };
        mongoSanitize(mockReq as Request, mockRes as Response, mockNext);
        expect(mockReq.body).toEqual({ name: 'ok' });
    });

    it('recursively handles nested objects', () => {
        mockReq.body = {
            level1: {
                level2: {
                    $gt: 'injection',
                    safe: 'value',
                },
            },
        };
        mongoSanitize(mockReq as Request, mockRes as Response, mockNext);
        expect(mockReq.body.level1.level2).toEqual({ safe: 'value' });
    });

    it('handles arrays containing malicious objects', () => {
        mockReq.body = { items: [{ $gt: '' }, { name: 'ok' }] };
        mongoSanitize(mockReq as Request, mockRes as Response, mockNext);
        expect(mockReq.body.items).toEqual([{}, { name: 'ok' }]);
    });

    it('leaves clean objects untouched', () => {
        const clean = { email: 'user@test.com', name: 'John', age: 25 };
        mockReq.body = { ...clean };
        mongoSanitize(mockReq as Request, mockRes as Response, mockNext);
        expect(mockReq.body).toEqual(clean);
    });

    it('sanitizes req.params', () => {
        mockReq.params = { id: '123', '$gt': 'hack' } as any;
        mongoSanitize(mockReq as Request, mockRes as Response, mockNext);
        expect(mockReq.params).toEqual({ id: '123' });
    });

    it('blanks query string values starting with $', () => {
        mockReq.query = { filter: '$gt', name: 'safe' };
        mongoSanitize(mockReq as Request, mockRes as Response, mockNext);
        expect(mockReq.query!.filter).toBe('');
        expect(mockReq.query!.name).toBe('safe');
    });

    it('always calls next()', () => {
        mongoSanitize(mockReq as Request, mockRes as Response, mockNext);
        expect(mockNext).toHaveBeenCalledTimes(1);
    });
});
