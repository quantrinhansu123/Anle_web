import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from '../../config/env';
import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';

export const authService = {
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  async login(email: string, password: string) {
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !employee) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!employee.password) {
      throw new AppError('Account not set up with a password. Please contact admin.', 401);
    }

    const isMatch = await this.comparePassword(password, employee.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate token
    const token = jwt.sign(
      { id: employee.id, email: employee.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRY as any }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = employee;

    return {
      user: userWithoutPassword,
      token,
    };
  },

  async getProfile(id: string) {
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !employee) {
      throw new AppError('User not found', 404);
    }

    const { password: _, ...userWithoutPassword } = employee;
    return userWithoutPassword;
  }
};
