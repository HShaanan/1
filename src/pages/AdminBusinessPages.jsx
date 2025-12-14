import React, { useState, useEffect, useMemo, useCallback } from "react";
import { BusinessPage } from "@/entities/BusinessPage";
import { Category } from "@/entities/Category";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText, Search, X, Edit, Eye, AlertTriangle, Check, Ban, Clock, Users,
  Mail, Phone, Star, ChevronDown, ChevronUp, Loader2, Snowflake, Play, MapPin, Download, Tag, Trash2, CheckSquare, Square
} from "lucide-react";
import { createPageUrl } from "@/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { base44 } from "@/api/base44Client";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};


export default function AdminBusinessPages() {
  const [businessPages, setBusinessPages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [expandedPageId, setExpandedPageId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'created_date', direction: 'descending' });

  const [freezeDialog, setFreezeDialog] = useState({ open: false, page: null });
  const [unfreezeDialog, setUnfreezeDialog] = useState({ open: false, page: null });
  const [freezeReason, setFreezeReason] = useState("");
  const [processingFreeze, setProcessingFreeze] = useState(false);

  const [importDialog, setImportDialog] = useState(false);
  const [searchCity, setSearchCity] = useState("ביתר עילית");
  const [searchTopic, setSearchTopic] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBusinesses, setSelectedBusinesses] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(null);
  // הוספה: state לבחירת קטגוריה
  const [selectedCategoryForImport, setSelectedCategoryForImport] = useState("");
  const [selectedSubcategoryForImport, setSelectedSubcategoryForImport] = useState("");
  const [successMessage, setSuccessMessage] = useState(""); // Added for success messages in import dialog

  // Multi-select state
  const [selectedPageIds, setSelectedPageIds] = useState([]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading all business pages...');

      // טעינה סדרתית עם delays למניעת Rate Limiting
      let pagesData = [];
      let catsData = [];
      let usersData = [];

      // שלב 1: טעינת קטגוריות (קל)
      try {
        console.log('📂 Loading categories...');
        catsData = await base44.entities.Category.list();
        console.log('✅ Categories loaded:', catsData.length);
      } catch (err) {
        console.warn('⚠️ Failed to load categories:', err.message);
      }

      // המתנה קצרה
      await new Promise(resolve => setTimeout(resolve, 300));

      // שלב 2: טעינת עמודי עסק
      try {
        console.log('📄 Loading business pages...');
        pagesData = await base44.entities.BusinessPage.list();
        console.log('✅ Business pages loaded:', pagesData.length);
      } catch (err) {
        console.error('❌ Failed to load business pages:', err.message);
        // ניסיון חוזר
        console.log('🔄 Retrying business pages...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        pagesData = await base44.entities.BusinessPage.list();
        console.log('✅ Business pages loaded on retry:', pagesData.length);
      }

      // המתנה קצרה
      await new Promise(resolve => setTimeout(resolve, 300));

      // שלב 3: טעינת משתמשים (הכי כבד)
      try {
        console.log('👥 Loading users...');
        usersData = await base44.entities.User.list();
        console.log('✅ Users loaded:', usersData.length);
      } catch (err) {
        console.warn('⚠️ Failed to load users, using empty array:', err.message);
        // אם נכשל - נמשיך בלי משתמשים
        usersData = [];
      }

      console.log('✅ All data loaded successfully');
      console.log('📊 Pages by status:', {
        pending: pagesData.filter(p => p.approval_status === 'pending').length,
        approved: pagesData.filter(p => p.approval_status === 'approved').length,
        rejected: pagesData.filter(p => p.approval_status === 'rejected').length,
        frozen: pagesData.filter(p => p.is_frozen).length,
        active: pagesData.filter(p => p.is_active && p.approval_status === 'approved' && !p.is_frozen).length
      });

      setBusinessPages(pagesData);
      setCategories(catsData);
      setUsers(usersData);
      setError("");

    } catch (err) {
      console.error('❌ Critical error loading data:', err);
      setError("שגיאה בטעינת הנתונים. מרענן אוטומטית...");

      // ניסיון אחרון לרענן אוטומטית
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const filteredAndSortedPages = useMemo(() => {
    let filtered = businessPages;

    if (debouncedSearchTerm) {
      filtered = filtered.filter(page =>
        page.business_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        page.business_owner_email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(page => page.approval_status === statusFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(page => page.category_id === categoryFilter);
    }

    if (userFilter !== "all") {
      filtered = filtered.filter(page => page.business_owner_email === userFilter);
    }

    filtered.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [businessPages, debouncedSearchTerm, statusFilter, categoryFilter, userFilter, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (name) => {
    if (sortConfig.key !== name) {
      return <ChevronDown className="h-4 w-4 text-gray-400" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ChevronUp className="h-4 w-4" />;
    }
    return <ChevronDown className="h-4 w-4" />;
  };

  const handleStatusUpdate = async (pageId, status, reason = "") => {
    try {
      const updateData = { approval_status: status };
      if (status === 'approved') {
        updateData.is_active = true;
        updateData.rejection_reason = null;
      } else if (status === 'rejected') {
        updateData.is_active = false;
        updateData.rejection_reason = reason;
      } else if (status === 'pending') {
        updateData.is_active = false;
      }

      await BusinessPage.update(pageId, updateData);

      setBusinessPages(prevPages =>
        prevPages.map(p =>
          p.id === pageId ? { ...p, ...updateData } : p
        )
      );
      if (status === 'rejected') {
        setExpandedPageId(null);
        setRejectionReason("");
      }
    } catch (err) {
      setError("שגיאה בעדכון סטטוס: " + err.message);
    }
  };

  const handleFreezePage = async () => {
    if (!freezeDialog.page) return;

    console.log('[AdminBusinessPages] 🧊 Freezing page:', freezeDialog.page.business_name, freezeDialog.page.id);

    setProcessingFreeze(true);
    try {
      const updateData = {
        is_frozen: true,
        frozen_at: new Date().toISOString(),
        frozen_reason: freezeReason || null
      };

      await BusinessPage.update(freezeDialog.page.id, updateData);

      setBusinessPages(prev =>
        prev.map(p =>
          p.id === freezeDialog.page.id ? { ...p, ...updateData } : p
        )
      );

      setFreezeDialog({ open: false, page: null });
      setFreezeReason("");

      console.log('[AdminBusinessPages] ✅ Page frozen successfully');
    } catch (err) {
      console.error('[AdminBusinessPages] ❌ Freeze error:', err);
      setError("שגיאה בהקפאת העמוד: " + err.message);
    } finally {
      setProcessingFreeze(false);
    }
  };

  const handleUnfreezePage = async () => {
    if (!unfreezeDialog.page) return;

    console.log('[AdminBusinessPages] 🔥 Unfreezing page:', unfreezeDialog.page.business_name, unfreezeDialog.page.id);

    setProcessingFreeze(true);
    try {
      const updateData = {
        is_frozen: false,
        frozen_at: null,
        frozen_reason: null
      };

      await BusinessPage.update(unfreezeDialog.page.id, updateData);

      setBusinessPages(prev =>
        prev.map(p =>
          p.id === unfreezeDialog.page.id ? { ...p, ...updateData } : p
        )
      );

      setUnfreezeDialog({ open: false, page: null });

      console.log('[AdminBusinessPages] ✅ Page unfrozen successfully');
    } catch (err) {
      console.error('[AdminBusinessPages] ❌ Unfreeze error:', err);
      setError("שגיאה בהפשרת העמוד: " + err.message);
    } finally {
      setProcessingFreeze(false);
    }
  };

  const handleDebugBusinesses = async () => {
    setError("");
    try {
      console.log('🐛 Calling debug function...');

      // הוספת timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Debug request timeout')), 15000)
      );

      const debugPromise = base44.functions.invoke('debugBusinessOwnership', {});

      const { data } = await Promise.race([debugPromise, timeoutPromise]);

      console.log('🐛 Debug Results:', data);

      if (data && data.success) {
        console.log('✅ Total pages in DB:', data.total_pages);
        console.log('📊 Summary:', data.summary);
        console.log('📋 All pages:', data.pages);

        const msg = `✅ נמצאו ${data.total_pages} עמודים במערכת\n\n` +
          `📊 סיכום:\n` +
          `• ממתינים לאישור: ${data.summary.pending}\n` +
          `• מאושרים: ${data.summary.approved}\n` +
          `• נדחו: ${data.summary.rejected}\n` +
          `• פעילים: ${data.summary.active}\n` +
          `• מוקפאים: ${data.summary.frozen}\n\n` +
          `בדוק את הקונסול (F12) לפרטים מלאים.`;

        alert(msg);
      } else {
        console.error('❌ Debug failed:', data);
        alert('שגיאה: ' + (data?.error || 'לא ידוע'));
      }
    } catch (err) {
      console.error('🐛 Debug error:', err);
      const errorMsg = err.message || 'שגיאה לא ידועה';
      setError('שגיאה בבדיקת המערכת: ' + errorMsg);
      alert('שגיאה בבדיקת המערכת: ' + errorMsg);
    }
  };

  const handleSearchPlaces = async () => {
    if (!searchCity || !searchTopic) {
      setError("נא למלא גם עיר וגם נושא");
      return;
    }

    setIsSearching(true);
    setImportSuccess(null);
    setError("");
    setSuccessMessage(""); // Clear previous success messages

    try {
      console.log('🔍 Searching for:', { city: searchCity, topic: searchTopic });
      const { data } = await base44.functions.invoke('searchGooglePlaces', {
        city: searchCity,
        topic: searchTopic,
        radius: 5000
      });

      console.log('📊 Search results:', data);

      if (data.success) {
        const newBusinesses = data.businesses || [];

        // הוספת העסקים החדשים לרשימה הקיימת (ללא כפילויות)
        setSearchResults(prev => {
          const existingPlaceIds = new Set(prev.map(b => b.place_id));
          const uniqueNew = newBusinesses.filter(b => !existingPlaceIds.has(b.place_id));
          return [...prev, ...uniqueNew];
        });

        if (newBusinesses.length > 0) {
          setSuccessMessage(`✅ נמצאו ${newBusinesses.length} עסקים חדשים והתווספו לרשימה!`);
          setTimeout(() => setSuccessMessage(""), 3000);
        } else {
          setError("לא נמצאו עסקים נוספים עבור חיפוש זה");
        }

      } else {
        setError(data.error || "שגיאה בחיפוש");
      }
    } catch (err) {
      console.error('❌ Search error:', err);
      setError("שגיאה בחיפוש: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleBusinessSelection = (business) => {
    setSelectedBusinesses(prev => {
      const exists = prev.some(b => b.place_id === business.place_id);
      if (exists) {
        return prev.filter(b => b.place_id !== business.place_id);
      } else {
        return [...prev, business];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedBusinesses.length === searchResults.length && searchResults.length > 0) {
      setSelectedBusinesses([]);
    } else {
      setSelectedBusinesses([...searchResults]);
    }
  };

  const handleResetSearch = () => {
    setSearchCity("");
    setSearchTopic("");
    setSearchResults([]);
    setSelectedBusinesses([]);
    setSelectedCategoryForImport("");
    setSelectedSubcategoryForImport("");
    setError("");
    setSuccessMessage("");
  };

  const handleImportSelected = async () => {
    if (selectedBusinesses.length === 0) {
      setError("לא נבחרו עסקים לייבוא");
      return;
    }

    if (!selectedCategoryForImport) {
      setError("נא לבחור קטגוריה לעסקים");
      return;
    }

    const confirmed = confirm(
      `האם לייבא ${selectedBusinesses.length} עסקים?\n\n` +
      `העסקים ייווצרו כעמודי עסק ממתינים לאישור.\n` +
      `תוכל לערוך אותם ולאשר אותם לאחר מכן.`
    );
    if (!confirmed) return;

    setIsImporting(true);
    setImportSuccess(null); // Reset import success state before new import
    setError("");

    try {
      console.log('📥 Starting import of', selectedBusinesses.length, 'businesses');
      console.log('📋 Businesses to import:', selectedBusinesses.map(b => b.name));
      console.log('📋 Category ID:', selectedCategoryForImport);
      console.log('📋 Subcategory ID:', selectedSubcategoryForImport);

      const { data } = await base44.functions.invoke('importSelectedBusinesses', {
        businesses: selectedBusinesses,
        category_id: selectedCategoryForImport,
        subcategory_id: selectedSubcategoryForImport || null
      });

      console.log('📊 Import result:', data);

      if (data.success) {
        // Construct detailed alert message
        let msg = '';

        if (data.imported && data.imported.length > 0) {
          msg += `✅ יובאו בהצלחה ${data.imported.length} עסקים!\n\n`;
          msg += '📋 עסקים שיובאו:\n';
          data.imported.forEach(b => {
            msg += `• ${b.name}\n`;
            msg += `  ID: ${b.id}\n`;
            msg += `  סטטוס: ${b.approval_status === 'pending' ? 'ממתין לאישור' : b.approval_status}\n\n`;
          });
        } else {
          msg += '⚠️ לא יובאו עסקים חדשים.\n\n';
        }

        if (data.errors && data.errors.length > 0) {
          msg += `⚠️ ${data.errors.length} עסקים כבר קיימים במערכת או נכשלו בייבוא:\n`;
          data.errors.forEach(e => {
            msg += `• ${e.name}: ${e.error}\n`;
          });
          msg += '\n';
        }

        msg += '💡 העסקים נוצרו בסטטוס "ממתין לאישור". תוכל לערוך ולאשר אותם עכשיו.';

        alert(msg); // Show detailed alert

        // Refresh data
        console.log('🔄 Refreshing data...');
        await loadAllData();
        console.log('✅ Data refreshed');

        // Reset form
        setSearchResults([]);
        setSelectedBusinesses([]);
        setSelectedCategoryForImport(""); // איפוס הקטגוריה
        setSelectedSubcategoryForImport(""); // איפוס תת-קטגוריה

        // Show "pending" filter to see new businesses
        setStatusFilter('pending');

        // Close dialog
        setImportDialog(false);

      } else {
        setError(data.error || "שגיאה בייבוא");
      }
    } catch (err) {
      console.error('❌ Import error:', err);
      setError("שגיאה בייבוא: " + (err.response?.data?.error || err.message));
    } finally {
      setIsImporting(false);
    }
  };

  const getCategoryName = (id) => categories.find(c => c.id === id)?.name || "לא ידוע";
  const getUserFullName = (email) => users.find(u => u.email === email)?.full_name || email;

  const StatusBadge = ({ status }) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />מאושר</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />ממתין</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800"><Ban className="h-3 w-3 mr-1" />נדחה</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  // קטגוריות ראשיות בלבד
  const mainCategories = useMemo(() =>
    categories.filter(c => !c.parent_id),
    [categories]
  );

  const subcategoriesForImport = useMemo(() => {
    if (!selectedCategoryForImport) return [];
    return categories.filter(c => c.parent_id === selectedCategoryForImport);
  }, [selectedCategoryForImport, categories]);

  const handleRefresh = async () => {
    console.log("🔄 Manual refresh triggered");
    setIsLoading(true);
    setError("");

    try {
      await loadAllData();
      alert("✅ הנתונים רועננו בהצלחה!");
    } catch (err) {
      console.error("Manual refresh failed:", err);
      setError("שגיאה ברענון הנתונים. מרענן את הדף...");
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePageSelection = (pageId) => {
    setSelectedPageIds(prev => 
      prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  const toggleSelectAllPages = () => {
    if (selectedPageIds.length === filteredAndSortedPages.length && filteredAndSortedPages.length > 0) {
      setSelectedPageIds([]);
    } else {
      setSelectedPageIds(filteredAndSortedPages.map(p => p.id));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPageIds.length === 0) return;
    
    const confirmed = confirm(`לאשר ${selectedPageIds.length} עמודים?`);
    if (!confirmed) return;

    setIsLoading(true);
    try {
      for (const pageId of selectedPageIds) {
        await BusinessPage.update(pageId, {
          approval_status: 'approved',
          is_active: true,
          rejection_reason: null
        });
      }
      
      await loadAllData();
      setSelectedPageIds([]);
      alert(`✅ ${selectedPageIds.length} עמודים אושרו בהצלחה!`);
    } catch (err) {
      setError("שגיאה באישור קבוצתי: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedPageIds.length === 0) return;
    
    const reason = prompt(`הזן סיבת דחייה עבור ${selectedPageIds.length} עמודים:`);
    if (!reason) return;

    setIsLoading(true);
    try {
      for (const pageId of selectedPageIds) {
        await BusinessPage.update(pageId, {
          approval_status: 'rejected',
          is_active: false,
          rejection_reason: reason
        });
      }
      
      await loadAllData();
      setSelectedPageIds([]);
      alert(`✅ ${selectedPageIds.length} עמודים נדחו`);
    } catch (err) {
      setError("שגיאה בדחייה קבוצתית: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPageIds.length === 0) return;
    
    const confirmed = confirm(
      `⚠️ האם למחוק ${selectedPageIds.length} עמודים?\n\nפעולה זו אינה הפיכה!`
    );
    if (!confirmed) return;

    const doubleConfirm = confirm(`האם אתה בטוח לגמרי? זה ימחק ${selectedPageIds.length} עמודים לצמיתות!`);
    if (!doubleConfirm) return;

    setIsLoading(true);
    try {
      for (const pageId of selectedPageIds) {
        await base44.entities.BusinessPage.delete(pageId);
      }
      
      await loadAllData();
      setSelectedPageIds([]);
      alert(`✅ ${selectedPageIds.length} עמודים נמחקו`);
    } catch (err) {
      setError("שגיאה במחיקה קבוצתית: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">טוען נתונים...</div>;
  }

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">ניהול עמודי עסק</h1>
              <p className="text-gray-500">
                {businessPages.length} עמודים במערכת | {businessPages.filter(p => p.approval_status === 'pending').length} ממתינים לאישור
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              {isLoading ? 'מרענן...' : 'רענן'}
            </Button>

            <Button
              onClick={() => setImportDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2"
            >
              <MapPin className="w-4 h-4" />
              ייבוא מ-Google Places
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Bulk Actions Bar */}
        {selectedPageIds.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">
                נבחרו {selectedPageIds.length} עמודים
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleBulkApprove}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 ml-1" />
                אשר הכל
              </Button>
              <Button
                onClick={handleBulkReject}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Ban className="w-4 h-4 ml-1" />
                דחה הכל
              </Button>
              <Button
                onClick={handleBulkDelete}
                size="sm"
                variant="destructive"
              >
                <Trash2 className="w-4 h-4 ml-1" />
                מחק הכל
              </Button>
              <Button
                onClick={() => setSelectedPageIds([])}
                size="sm"
                variant="outline"
              >
                בטל בחירה
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="חפש לפי שם עסק או אימייל..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="סנן לפי סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              <SelectItem value="pending">ממתין לאישור</SelectItem>
              <SelectItem value="approved">מאושר</SelectItem>
              <SelectItem value="rejected">נדחה</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="סנן לפי קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הקטגוריות</SelectItem>
              {categories.filter(c => !c.parent_id).map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger>
              <SelectValue placeholder="סנן לפי משתמש" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל המשתמשים</SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.email}>{user.full_name || user.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-3 text-center w-12">
                  <input
                    type="checkbox"
                    checked={selectedPageIds.length === filteredAndSortedPages.length && filteredAndSortedPages.length > 0}
                    onChange={toggleSelectAllPages}
                    className="w-4 h-4 cursor-pointer"
                    aria-label="בחר הכל"
                  />
                </th>
                <th className="p-3" onClick={() => requestSort('business_name')}>
                  <div className="flex items-center gap-1 cursor-pointer">שם העסק {getSortIcon('business_name')}</div>
                </th>
                <th className="p-3" onClick={() => requestSort('business_owner_email')}>
                  <div className="flex items-center gap-1 cursor-pointer">בעל העסק {getSortIcon('business_owner_email')}</div>
                </th>
                <th className="p-3">קטגוריה</th>
                <th className="p-3" onClick={() => requestSort('created_date')}>
                  <div className="flex items-center gap-1 cursor-pointer">תאריך יצירה {getSortIcon('created_date')}</div>
                </th>
                <th className="p-3">סטטוס</th>
                <th className="p-3 text-center">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedPages.map(page => (
                <React.Fragment key={page.id}>
                  <tr className={`border-b hover:bg-gray-50 ${selectedPageIds.includes(page.id) ? 'bg-blue-50' : ''}`}>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedPageIds.includes(page.id)}
                        onChange={() => togglePageSelection(page.id)}
                        className="w-4 h-4 cursor-pointer"
                        aria-label={`בחר ${page.business_name}`}
                      />
                    </td>
                    <td className="p-3 font-medium">
                      <div className="flex items-center gap-2">
                        {page.business_name}
                        {page.is_frozen && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            <Snowflake className="w-3 h-3 ml-1" />
                            מוקפא
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3">{getUserFullName(page.business_owner_email)}</td>
                    <td className="p-3">{getCategoryName(page.category_id)}</td>
                    <td className="p-3">{new Date(page.created_date).toLocaleDateString('he-IL')}</td>
                    <td className="p-3"><StatusBadge status={page.approval_status} /></td>
                    <td className="p-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">אפשרויות</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => window.open(createPageUrl(`BusinessPage?id=${page.id}`), '_blank')}>
                            <Eye className="w-4 h-4 ml-2" /> צפה בעמוד
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(createPageUrl(`EditBusinessPage?id=${page.id}`), '_blank')}>
                            <Edit className="w-4 h-4 ml-2" /> ערוך
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(page.id, 'approved')} className="text-green-600">
                            <Check className="w-4 h-4 ml-2" /> אשר
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setExpandedPageId(page.id === expandedPageId ? null : page.id)} className="text-red-600">
                            <Ban className="w-4 h-4 ml-2" /> דחה
                          </DropdownMenuItem>

                          {page.is_frozen ? (
                            <DropdownMenuItem
                              onClick={() => setUnfreezeDialog({ open: true, page })}
                              className="text-green-600 focus:text-green-700"
                            >
                              <Play className="w-4 h-4 ml-2" />
                              הפשר עמוד
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setFreezeDialog({ open: true, page })}
                              className="text-blue-600 focus:text-blue-700"
                            >
                              <Snowflake className="w-4 h-4 ml-2" />
                              הקפא עמוד
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                  {expandedPageId === page.id && (
                    <tr className="bg-red-50">
                      <td colSpan="7" className="p-4">
                        <h4 className="font-semibold mb-2">סיבת דחייה:</h4>
                        <Input
                          placeholder="לדוגמה: תיאור העסק חסר, תמונות לא רלוונטיות וכו'."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="mb-2"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(page.id, 'rejected', rejectionReason)}
                            disabled={!rejectionReason}
                          >
                            אישור דחייה
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setExpandedPageId(null)}
                          >
                            ביטול
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {filteredAndSortedPages.length === 0 && (
            <div className="text-center p-8 text-gray-500">
              <p>לא נמצאו עמודים התואמים לחיפוש.</p>
            </div>
          )}
        </div>

        {/* Freeze Dialog */}
        <Dialog open={freezeDialog.open} onOpenChange={(open) => setFreezeDialog({ open, page: null })}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Snowflake className="w-5 h-5 text-blue-600" />
                הקפאת עמוד עסק
              </DialogTitle>
              <DialogDescription>
                העמוד לא יופיע באתר בזמן ההקפאה, אבל כל הנתונים יישמרו
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  סיבת הקפאה (אופציונלית)
                </label>
                <Textarea
                  placeholder="למשל: שיפוצים, חופשה, עונת השנה..."
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  rows={3}
                />
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-900">
                  💡 <strong>טיפ:</strong> הקפאה זמנית מאפשרת להסתיר את העמוד מבלי למחוק אותו.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setFreezeDialog({ open: false, page: null })}
                disabled={processingFreeze}
              >
                ביטול
              </Button>
              <Button
                onClick={handleFreezePage}
                disabled={processingFreeze}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {processingFreeze ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מקפיא...
                  </>
                ) : (
                  <>
                    <Snowflake className="w-4 h-4 ml-2" />
                    הקפא עמוד
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unfreeze Dialog */}
        <Dialog open={unfreezeDialog.open} onOpenChange={(open) => setUnfreezeDialog({ open, page: null })}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-green-600" />
                הפשרת עמוד עסק
              </DialogTitle>
              <DialogDescription>
                העמוד יחזור להיות פעיל ויופיע שוב באתר
              </DialogDescription>
            </DialogHeader>

            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-sm text-green-900">
                ✅ העמוד יחזור להיות נראה לכל המשתמשים באתר
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUnfreezeDialog({ open: false, page: null })}
                disabled={processingFreeze}
              >
                ביטול
              </Button>
              <Button
                onClick={handleUnfreezePage}
                disabled={processingFreeze}
                className="bg-green-600 hover:bg-green-700"
              >
                {processingFreeze ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מפשיר...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 ml-2" />
                    הפשר עמוד
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* דיאלוג ייבוא מ-Google Places */}
        <Dialog open={importDialog} onOpenChange={(open) => {
          setImportDialog(open);
          if (!open) { // Reset state when dialog closes
            setSearchResults([]);
            setSelectedBusinesses([]);
            setImportSuccess(null);
            setSelectedCategoryForImport(""); // איפוס הקטגוריה
            setSelectedSubcategoryForImport(""); // איפוס תת-קטגוריה
            setSearchCity(""); // Reset search city on close
            setSearchTopic(""); // Reset search topic on close
            setError(""); // Clear error message when closing
            setSuccessMessage(""); // Clear success message on close
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-600" />
                חיפוש וייבוא עסקים מ-Google Places
              </DialogTitle>
              <DialogDescription>
                חפש עסקים לפי עיר ונושא, בחר קטגוריה, ולאחר מכן בחר את העסקים שתרצה לייבא
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* טופס חיפוש */}
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-blue-900">חיפוש עסקים</h3>
                  {searchResults.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetSearch}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4 ml-1" />
                      נקה הכל
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">עיר</label>
                    <Input
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      placeholder="למשל: ביתר עילית"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">נושא</label>
                    <Input
                      value={searchTopic}
                      onChange={(e) => setSearchTopic(e.target.value)}
                      placeholder="למשל: חנויות, מסעדות..."
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleSearchPlaces}
                      disabled={isSearching || !searchCity || !searchTopic}
                      className="w-full"
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          מחפש...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 ml-2" />
                          {searchResults.length > 0 ? 'חפש עוד' : 'חפש'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {successMessage && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-900">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              {/* בחירת קטגוריה ותת-קטגוריה - רק אם יש תוצאות */}
              {searchResults.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-blue-900">
                      <Tag className="w-4 h-4 inline ml-1" />
                      בחר קטגוריה עבור העסקים שתייבא:
                    </label>
                    <Select
                      value={selectedCategoryForImport}
                      onValueChange={(value) => {
                        setSelectedCategoryForImport(value);
                        setSelectedSubcategoryForImport(""); // איפוס תת-קטגוריה בשינוי קטגוריה
                      }}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="בחר קטגוריה..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mainCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!selectedCategoryForImport && (
                      <p className="text-xs text-blue-700 mt-1">
                        ⚠️ חובה לבחור קטגוריה לפני הייבוא
                      </p>
                    )}
                  </div>

                  {subcategoriesForImport.length > 0 && selectedCategoryForImport && (
                    <div>
                      <label className="text-sm font-medium mb-2 block text-blue-900">
                        תת-קטגוריה (אופציונלי):
                      </label>
                      <Select
                        value={selectedSubcategoryForImport}
                        onValueChange={setSelectedSubcategoryForImport}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="בחר תת-קטגוריה (אופציונלי)..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>ללא תת-קטגוריה</SelectItem>
                          {subcategoriesForImport.map((subcat) => (
                            <SelectItem key={subcat.id} value={subcat.id}>
                              {subcat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* תוצאות חיפוש */}
              {searchResults.length > 0 && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      <input
                        type="checkbox"
                        checked={selectedBusinesses.length === searchResults.length && searchResults.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm font-medium">
                        נמצאו {searchResults.length} עסקים | נבחרו {selectedBusinesses.length}
                      </span>
                    </div>

                    {selectedBusinesses.length > 0 && (
                      <Button
                        onClick={handleImportSelected}
                        disabled={isImporting || !selectedCategoryForImport}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isImporting ? (
                          <>
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            מייבא...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 ml-2" />
                            ייבא {selectedBusinesses.length} עסקים
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* רשימת עסקים */}
                  <div className="grid gap-3 max-h-96 overflow-y-auto">
                    {searchResults.map((business) => {
                      const isSelected = selectedBusinesses.some(b => b.place_id === business.place_id);

                      return (
                        <div
                          key={business.place_id}
                          className={`border rounded-lg p-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                            isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                          }`}
                          onClick={() => toggleBusinessSelection(business)}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="mt-1 w-4 h-4"
                            />

                            {business.images?.[0] && (
                              <img
                                src={business.images[0]}
                                alt={business.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}

                            <div className="flex-1">
                              <h4 className="font-bold text-slate-900">{business.name}</h4>
                              <p className="text-sm text-slate-600">{business.address}</p>
                              {business.phone && (
                                <p className="text-sm text-slate-500">📞 {business.phone}</p>
                              )}
                              {business.rating > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                  <span className="text-sm font-medium">{business.rating}</span>
                                  <span className="text-xs text-slate-500">({business.reviews_count} ביקורות)</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {searchResults.length === 0 && !isSearching && searchCity && searchTopic && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertDescription className="text-yellow-900">
                    לא נמצאו עסקים עבור החיפוש הזה. נסה מילות מפתח אחרות.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setImportDialog(false);
                setSearchResults([]);
                setSelectedBusinesses([]);
                setImportSuccess(null);
                setSelectedCategoryForImport("");
                setSelectedSubcategoryForImport("");
                setSearchCity("");
                setSearchTopic("");
                setError("");
                setSuccessMessage("");
              }}>
                סגור
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}