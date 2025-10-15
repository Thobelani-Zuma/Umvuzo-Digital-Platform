import React, { useState, useEffect } from 'react';
import { RATE_SHEETS } from '../constants';
import { Transaction } from '../types';
import { PlusIcon, TrashIcon, PrintIcon } from '../components/icons/Icons';
import { LOGO_BASE64 } from '../components/Logo';

interface TransactionsPageProps {
  repName: string;
  addMultipleTransactions: (items: Omit<Transaction, 'id' | 'date' | 'repName' | 'clientName' | 'userEmail'>[], clientName: string) => void;
}

type TransactionItem = Omit<Transaction, 'id' | 'date' | 'repName' | 'clientName' | 'userEmail'>;

export function TransactionsPage({ repName, addMultipleTransactions }: TransactionsPageProps) {
  const [clientName, setClientName] = useState('');
  const [rateSheet, setRateSheet] = useState(Object.keys(RATE_SHEETS)[0]);
  const [material, setMaterial] = useState(RATE_SHEETS[rateSheet][0].type);
  const [weight, setWeight] = useState('');
  const [items, setItems] = useState