import { useAuth } from '@/auth/AuthContext';
import { useMemo } from 'react';

/**
 * Enhanced useAuth hook with additional utilities for dashboard analytics
 */
export function useAuthEnhanced() {
  const auth = useAuth();
  const { completeUser } = auth;


  const isPrimaryAdmin = useMemo(() => {
    return completeUser?.is_primary_admin === true;
  }, [completeUser]);

  /**
   * Check if user is a company super admin
   */
  const isCompanySuperAdmin = useMemo(() => {
    return completeUser?.role === 'company_super_admin';
  }, [completeUser]);

  /**
   * Check if user is a company admin
   */
  const isCompanyAdmin = useMemo(() => {
    return completeUser?.role === 'company_admin';
  }, [completeUser]);

  /**
   * Check if user is a master admin
   */
  const isMasterAdmin = useMemo(() => {
    return completeUser?.role === 'master_admin';
  }, [completeUser]);



  /**
   * Get company ID
   */
  const companyId = useMemo(() => {
    return completeUser?.company_id?._id || completeUser?.company_id;
  }, [completeUser]);

  /**
   * Get user's full name
   */
  const fullName = useMemo(() => {
    if (!completeUser) return '';
    return completeUser.username || completeUser.email || '';
  }, [completeUser]);

  /**
   * Check if user has dashboard access
   */
  const hasDashboardAccess = useMemo(() => {
    if (!completeUser) return false;
    
    // Master admin always has access
    if (completeUser.role === 'master_admin') return true;
    
    // Company super admin and company admin have access
    return completeUser.role === 'company_super_admin' || 
           completeUser.role === 'company_admin';
  }, [completeUser]);


  /**
   * Get company name
   */
  const companyName = useMemo(() => {
    return completeUser?.company_id?.company_name || completeUser?.company_name || '';
  }, [completeUser]);

  return {
    ...auth,
    // User role checks
    isPrimaryAdmin,
    isCompanySuperAdmin,
    isCompanyAdmin,
    isMasterAdmin,
    
 
    
    // User info
    companyId,
    companyName,
    fullName,

    
    // Access checks
    hasDashboardAccess,
  };
}
