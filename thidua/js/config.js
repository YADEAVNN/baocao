export const SUPABASE_URL = "https://pxjfzptlvylcvxlpogpd.supabase.co";
export const SUPABASE_KEY = "sb_publishable_jWogR4H9N6kUQ-9lDnaMcg_RlV9WZdU";

export const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// State Management
export const STATE = {
    currentUser: null,
    globalShopMap: {},
    globalAssignedShops: [], 
    assignedShopCodes: [],
    currentAdminPrices: [],  
    cachedDirectorData: [],  
    chartInstances: {},      
    submittedShops: new Set() 
};