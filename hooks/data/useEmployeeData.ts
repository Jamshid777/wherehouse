import { useState } from 'react';
import { Employee, Expense } from '../../types';

interface UseEmployeeDataProps {
    initialEmployees: Employee[];
    expenses: Expense[];
}

export const useEmployeeData = ({ initialEmployees, expenses }: UseEmployeeDataProps) => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);

  const addEmployee = (employee: Omit<Employee, 'id'>): Employee => {
    const newEmployee = { ...employee, id: `emp${Date.now()}` };
    setEmployees(prev => [newEmployee, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
    return newEmployee;
  };

  const updateEmployee = (updatedEmployee: Employee) => {
    setEmployees(prev => prev.map(e => e.id === updatedEmployee.id ? updatedEmployee : e).sort((a,b) => a.name.localeCompare(b.name)));
  };

  const deleteEmployee = (employeeId: string) => {
    if (expenses.some(exp => exp.employeeId === employeeId)) {
      alert("Bu xodim bilan bog'liq harajat mavjudligi sababli o'chirib bo'lmaydi.");
      return;
    }
    setEmployees(prev => prev.filter(e => e.id !== employeeId));
  };

  return { employees, setEmployees, addEmployee, updateEmployee, deleteEmployee };
};
