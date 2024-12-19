import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  products: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  status: string;
  date: string;
}

export const getOrders = (): Order[] => {
  try {
    const orders = localStorage.getItem("orders");
    if (!orders) return [];
    const parsedOrders = JSON.parse(orders);
    return Array.isArray(parsedOrders) ? parsedOrders : [];
  } catch (error) {
    console.error("Error getting orders:", error);
    return [];
  }
};

export const saveOrder = (order: Order): boolean => {
  try {
    const orders = getOrders();
    const updatedOrders = [...orders, order];
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new CustomEvent("ordersUpdated"));
    return true;
  } catch (error) {
    console.error("Error saving order:", error);
    return false;
  }
};

export const updateOrder = (orderId: string, updates: Partial<Order>): boolean => {
  try {
    const orders = getOrders();
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, ...updates } : order
    );
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new CustomEvent("ordersUpdated"));
    return true;
  } catch (error) {
    console.error("Error updating order:", error);
    return false;
  }
};

export const generateOrderId = (): string => {
  const orders = getOrders();
  return `ORD${String(orders.length + 1).padStart(3, '0')}`;
};
