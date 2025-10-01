import { useState } from 'react';
import { Dish, Recipe } from '../../types';

export const useDishData = (initialDishes: Dish[], initialRecipes: Recipe[]) => {
    const [dishes, setDishes] = useState<Dish[]>(initialDishes);
    const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);

    const addDish = (dish: Omit<Dish, 'id'>, recipeData: Omit<Recipe, 'dishId'>) => {
        const newDish = { ...dish, id: `d${Date.now()}` };
        const newRecipe = { ...recipeData, dishId: newDish.id };
        setDishes(prev => [newDish, ...prev]);
        setRecipes(prev => [newRecipe, ...prev]);
        return newDish;
    };
    const updateDish = (updatedDish: Dish, updatedRecipeData: Omit<Recipe, 'dishId'>) => {
        setDishes(prev => prev.map(d => d.id === updatedDish.id ? updatedDish : d));
        setRecipes(prev => prev.map(r => r.dishId === updatedDish.id ? { ...updatedRecipeData, dishId: updatedDish.id } : r));
    };
    const deleteDish = (dishId: string) => {
        setDishes(prev => prev.filter(d => d.id !== dishId));
        setRecipes(prev => prev.filter(r => r.dishId !== dishId));
    };

    return { dishes, setDishes, recipes, setRecipes, addDish, updateDish, deleteDish };
};
