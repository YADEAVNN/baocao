export const SUPABASE_URL = "https://xcfnmqnwbydohlopmcaa.supabase.co";
export const SUPABASE_KEY = "sb_publishable_HC1LJC05cpNezUyqE32lbg_TjDCNHHj";

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
