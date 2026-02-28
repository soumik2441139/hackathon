"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema, target = 'body') => (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors,
        });
        return;
    }
    req[target] = result.data;
    next();
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map