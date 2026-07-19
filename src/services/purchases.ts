import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  initConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  hasActiveSubscriptions,
  getActiveSubscriptions,
  purchaseUpdatedListener,
  purchaseErrorListener,
} from 'expo-iap';
import {
  ANDROID_MONTHLY_SUB_ID,
  ANDROID_YEARLY_SUB_ID,
  IOS_MONTHLY_SUB_ID,
  IOS_YEARLY_SUB_ID,
} from '../constants/subscriptions';

export type SubscriptionProduct = {
  id: string;
  priceString: string;
  period: 'monthly' | 'yearly';
};

function getPlatformSubscriptionIds(): string[] {
  if (Platform.OS === 'ios') {
    return [IOS_MONTHLY_SUB_ID, IOS_YEARLY_SUB_ID];
  }
  if (Platform.OS === 'android') {
    return [ANDROID_MONTHLY_SUB_ID, ANDROID_YEARLY_SUB_ID];
  }
  return [];
}

function getMonthlyId(): string {
  return Platform.OS === 'ios' ? IOS_MONTHLY_SUB_ID : ANDROID_MONTHLY_SUB_ID;
}

function getYearlyId(): string {
  return Platform.OS === 'ios' ? IOS_YEARLY_SUB_ID : ANDROID_YEARLY_SUB_ID;
}

/** IAP requires a dev build or store build — not Expo Go */
export function isPurchasesConfigured(): boolean {
  return Constants.executionEnvironment !== 'storeClient';
}

function formatPrice(product: {
  displayPrice?: string;
  price?: number;
  currency?: string;
}): string {
  if (product.price != null && product.currency) {
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: product.currency,
      }).format(product.price);
    } catch {
      // ignore invalid currency
    }
  }
  return product.displayPrice ?? '';
}

function toSubscriptionProduct(
  product: { id: string; displayPrice?: string; price?: number; currency?: string },
  period: 'monthly' | 'yearly'
): SubscriptionProduct {
  return {
    id: product.id,
    priceString: formatPrice(product),
    period,
  };
}

export async function initPurchases(): Promise<boolean> {
  if (!isPurchasesConfigured()) return false;
  try {
    return await initConnection();
  } catch {
    return false;
  }
}

export async function getPremiumStatus(): Promise<boolean> {
  if (!isPurchasesConfigured()) return false;
  try {
    return await hasActiveSubscriptions(getPlatformSubscriptionIds());
  } catch {
    return false;
  }
}

export type PremiumProducts = {
  monthly: SubscriptionProduct | null;
  yearly: SubscriptionProduct | null;
};

export async function getPremiumProducts(): Promise<PremiumProducts> {
  if (!isPurchasesConfigured()) {
    return { monthly: null, yearly: null };
  }

  try {
    const skus = getPlatformSubscriptionIds();
    const products = (await fetchProducts({ skus, type: 'subs' })) ?? [];
    const monthly = products.find((p) => p.id === getMonthlyId());
    const yearly = products.find((p) => p.id === getYearlyId());

    return {
      monthly: monthly ? toSubscriptionProduct(monthly, 'monthly') : null,
      yearly: yearly ? toSubscriptionProduct(yearly, 'yearly') : null,
    };
  } catch {
    return { monthly: null, yearly: null };
  }
}

export async function purchaseSubscription(productId: string): Promise<boolean> {
  const products = (await fetchProducts({ skus: [productId], type: 'subs' })) ?? [];
  const subscription = products.find((p) => p.id === productId);
  if (!subscription) {
    throw new Error('Abonnement introuvable');
  }

  if (Platform.OS === 'android') {
    const offers =
      subscription.subscriptionOffers
        ?.filter((offer) => offer.offerTokenAndroid)
        .map((offer) => ({
          sku: productId,
          offerToken: offer.offerTokenAndroid!,
        })) ?? [];

    if (!offers.length) {
      throw new Error('Aucune offre disponible pour cet abonnement');
    }

    await requestPurchase({
      type: 'subs',
      request: {
        apple: { sku: productId },
        google: { skus: [productId], subscriptionOffers: offers },
      },
    });
  } else {
    await requestPurchase({
      type: 'subs',
      request: {
        apple: { sku: productId },
        google: { skus: [productId] },
      },
    });
  }

  return getPremiumStatus();
}

export async function restorePurchases(): Promise<boolean> {
  if (!isPurchasesConfigured()) return false;
  try {
    await getActiveSubscriptions(getPlatformSubscriptionIds());
    return await hasActiveSubscriptions(getPlatformSubscriptionIds());
  } catch {
    return false;
  }
}

export function addPremiumListener(onUpdate: (isPremium: boolean) => void): () => void {
  if (!isPurchasesConfigured()) return () => {};

  const purchaseSub = purchaseUpdatedListener(async (purchase) => {
    try {
      await finishTransaction({ purchase, isConsumable: false });
      onUpdate(await getPremiumStatus());
    } catch {
      // ignore
    }
  });

  const errorSub = purchaseErrorListener(() => {});

  return () => {
    purchaseSub.remove();
    errorSub.remove();
  };
}
