import { RateSheet, Transaction } from './types';

export const RATE_SHEETS: RateSheet = {
  "Walk-ins": [
    { type: "PET Clear", price: 3.6 },
    { type: "PET Green", price: 2.0 },
    { type: "PET Brown", price: 1.8 },
    { type: "C-oil", price: 1.3 },
    { type: "HDPE", price: 2 },
    { type: "Tins", price: 1.0 },
    { type: "Cans", price: 16.5 },
    { type: "C-plastic", price: 2 },
    { type: "M-plastic", price: 1.7 },
    { type: "W-paper", price: 1.0 },
    { type: "K4", price: 0.8 },
    { type: "TetraPak", price: 0.5 },
    { type: "PP", price: 0.2 },
    { type: "Glass bottles", price: 0.2 }
  ],
  "CCT": [
    { type: "PET Clear", price: 3.1 },
    { type: "PET Green", price: 1.5 },
    { type: "PET Brown", price: 1.3 },
    { type: "K4", price: 0.5 },
    { type: "C-Plastic", price: 1.6 },
    { type: "M-Plastic", price: 1.3 },
    { type: "Cans", price: 16.5 },
    { type: "HDPE", price: 1.7 },
    { type: "C-oil", price: 1.0 }
  ]
};

export const INITIAL_TRANSACTIONS: Transaction[] = [];
