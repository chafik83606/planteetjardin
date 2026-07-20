import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Alert, Platform } from 'react-native';
import {
  initPurchases,
  getPremiumStatus,
  getPremiumProducts,
  purchaseSubscription,
  restorePurchases,
  addPremiumListener,
  isPurchasesConfigured,
  type SubscriptionProduct,
} from '../services/purchases';
import { getTrialDaysRemaining, getTrialStartDate, isTrialActive } from '../services/trial';

interface SubscriptionContextType {
  isPremium: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  trialExpired: boolean;
  isLoading: boolean;
  purchasesReady: boolean;
  plantLimit: number;
  journalLimit: number;
  monthlyProduct: SubscriptionProduct | null;
  yearlyProduct: SubscriptionProduct | null;
  purchaseMonthly: () => Promise<void>;
  purchaseYearly: () => Promise<void>;
  restore: () => Promise<void>;
  canAddPlant: (currentCount: number) => boolean;
  canAddJournalEntry: (currentCount: number) => boolean;
  canUseDiagnosis: () => boolean;
  hasFullAccess: () => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasesReady, setPurchasesReady] = useState(false);
  const [monthlyProduct, setMonthlyProduct] = useState<SubscriptionProduct | null>(null);
  const [yearlyProduct, setYearlyProduct] = useState<SubscriptionProduct | null>(null);

  const refreshTrial = useCallback(() => {
    getTrialStartDate();
    setTrialDaysRemaining(getTrialDaysRemaining());
  }, []);

  const loadProducts = useCallback(async () => {
    const products = await getPremiumProducts();
    setMonthlyProduct(products.monthly);
    setYearlyProduct(products.yearly);
    setPurchasesReady(Boolean(products.monthly || products.yearly));
  }, []);

  useEffect(() => {
    let removeListener = () => {};

    async function setup() {
      refreshTrial();

      if (!isPurchasesConfigured()) {
        setIsLoading(false);
        return;
      }

      try {
        const connected = await initPurchases();
        if (!connected) return;

        setIsPremium(await getPremiumStatus());
        await loadProducts();
        removeListener = addPremiumListener(setIsPremium);
      } catch (error) {
        console.warn('IAP init failed:', error);
      } finally {
        setIsLoading(false);
      }
    }

    setup();
    return () => removeListener();
  }, [loadProducts, refreshTrial]);

  const trialActive = isTrialActive();
  const trialExpired = !trialActive;
  const hasFullAccess = () => isPremium || trialActive;

  const handlePurchase = async (product: SubscriptionProduct | null, label: string) => {
    if (!product) {
      const hint =
        Platform.OS === 'ios'
          ? 'L\'abonnement annuel n\'est pas encore configuré dans App Store Connect, ou les métadonnées sont incomplètes.'
          : 'Les offres Premium ne sont pas encore disponibles. Installez l\'app depuis le Play Store.';
      Alert.alert('Abonnement indisponible', hint);
      return;
    }

    try {
      const success = await purchaseSubscription(product.id);
      if (success) {
        setIsPremium(true);
        Alert.alert('Merci !', `Votre abonnement ${label} est actif.`);
      }
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'user-cancelled') return;
      Alert.alert('Erreur', 'Le paiement n\'a pas pu être finalisé. Réessayez plus tard.');
    }
  };

  const purchaseMonthly = () => handlePurchase(monthlyProduct, 'mensuel');
  const purchaseYearly = () => handlePurchase(yearlyProduct, 'annuel');

  const restore = async () => {
    if (!isPurchasesConfigured()) {
      Alert.alert('Indisponible', 'Les achats intégrés nécessitent une version installée depuis le store.');
      return;
    }

    try {
      const success = await restorePurchases();
      setIsPremium(success);
      Alert.alert(
        success ? 'Restauré' : 'Aucun abonnement',
        success
          ? 'Votre abonnement Premium a été restauré.'
          : 'Aucun abonnement actif trouvé pour ce compte.'
      );
    } catch {
      Alert.alert('Erreur', 'Impossible de restaurer les achats.');
    }
  };

  const canAddPlant = (_currentCount = 0) => hasFullAccess();
  const canAddJournalEntry = (_currentCount = 0) => hasFullAccess();
  const canUseDiagnosis = () => hasFullAccess();

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isTrialActive: trialActive,
        trialDaysRemaining,
        trialExpired,
        isLoading,
        purchasesReady,
        plantLimit: hasFullAccess() ? Infinity : 0,
        journalLimit: hasFullAccess() ? Infinity : 0,
        monthlyProduct,
        yearlyProduct,
        purchaseMonthly,
        purchaseYearly,
        restore,
        canAddPlant,
        canAddJournalEntry,
        canUseDiagnosis,
        hasFullAccess,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within SubscriptionProvider');
  return context;
}
