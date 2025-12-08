import { fetchFromApi } from '@/lib/api';
import { ConsumptionEntry, BillCategory } from '@/types/loan-application-types';

export interface ConsumptionEntryRequest {
    dataSource: string;
    billingAmount: number;
    billingDate: string;
    unitsConsumed?: number;
}

export const consumptionService = {
    /**
     * Get all consumption entries for the current user
     */
    async getMyEntries(): Promise<ConsumptionEntry[]> {
        try {
            const response = await fetchFromApi('/consumption');
            return response || [];
        } catch (error) {
            console.error('Failed to fetch consumption entries:', error);
            throw error;
        }
    },

    /**
     * Get recent bills from the last N months, grouped by category
     * @param months - Number of months to look back (default: 5)
     * @param referenceDate - Date to calculate the window from (default: now)
     */
    async getRecentBillsByCategory(months: number = 5, referenceDate: Date = new Date()): Promise<Map<BillCategory, ConsumptionEntry[]>> {
        try {
            const entries = await this.getMyEntries();

            // Calculate date threshold (N months ago from reference date)
            const thresholdDate = new Date(referenceDate);
            thresholdDate.setMonth(thresholdDate.getMonth() - months);

            // Filter entries from last N months relative to reference date
            // Also filter out entries that are AFTER the reference date (future relative to application)
            const recentEntries = entries.filter(entry => {
                const entryDate = new Date(entry.billingDate);
                return entryDate >= thresholdDate && entryDate <= referenceDate;
            });

            // Group by category (using dataSource as category)
            const billsByCategory = new Map<BillCategory, ConsumptionEntry[]>();

            // Initialize all categories
            Object.values(BillCategory).forEach(category => {
                billsByCategory.set(category, []);
            });

            // Group entries by category
            recentEntries.forEach(entry => {
                const category = this.mapDataSourceToCategory(entry.dataSource);
                const existing = billsByCategory.get(category) || [];
                billsByCategory.set(category, [...existing, entry]);
            });

            return billsByCategory;
        } catch (error) {
            console.error('Failed to fetch recent bills by category:', error);
            throw error;
        }
    },

    /**
     * Upload a single bill
     */
    async uploadBill(file: File, metadata: ConsumptionEntryRequest): Promise<ConsumptionEntry> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('dataSource', metadata.dataSource);
            formData.append('billingAmount', metadata.billingAmount.toString());
            formData.append('billingDate', metadata.billingDate);
            if (metadata.unitsConsumed) {
                formData.append('unitsConsumed', metadata.unitsConsumed.toString());
            }

            const response = await fetchFromApi('/consumption/upload', {
                method: 'POST',
                body: formData,
                // Don't set Content-Type header - browser will set it with boundary for FormData
                headers: undefined,
            });

            return response;
        } catch (error) {
            console.error('Failed to upload bill:', error);
            throw error;
        }
    },

    /**
     * Upload multiple bills at once for a specific category
     */
    async uploadBillBatch(files: File[], dataSource: string): Promise<ConsumptionEntry[]> {
        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });
            formData.append('dataSource', dataSource);

            const response = await fetchFromApi('/consumption/upload-batch', {
                method: 'POST',
                body: formData,
                headers: undefined,
            });

            return response || [];
        } catch (error) {
            console.error('Failed to upload bill batch:', error);
            throw error;
        }
    },

    /**
     * Map dataSource string to BillCategory enum
     */
    mapDataSourceToCategory(dataSource: string): BillCategory {
        const upperSource = dataSource.toUpperCase();

        if (upperSource.includes('ELECTRIC') || upperSource.includes('POWER')) {
            return BillCategory.ELECTRICITY;
        } else if (upperSource.includes('GAS') || upperSource.includes('LPG')) {
            return BillCategory.GAS;
        } else if (upperSource.includes('WATER')) {
            return BillCategory.WATER;
        } else if (upperSource.includes('TELEPHONE') || upperSource.includes('MOBILE') || upperSource.includes('PHONE')) {
            return BillCategory.TELEPHONE;
        } else if (upperSource.includes('INTERNET') || upperSource.includes('BROADBAND')) {
            return BillCategory.INTERNET;
        } else {
            return BillCategory.OTHER;
        }
    },

    /**
     * Map BillCategory to display name
     */
    getCategoryDisplayName(category: BillCategory): string {
        const displayNames: Record<BillCategory, string> = {
            [BillCategory.ELECTRICITY]: 'Electricity',
            [BillCategory.GAS]: 'Gas/LPG',
            [BillCategory.WATER]: 'Water',
            [BillCategory.TELEPHONE]: 'Telephone',
            [BillCategory.INTERNET]: 'Internet/Broadband',
            [BillCategory.OTHER]: 'Other',
        };
        return displayNames[category];
    },
};
