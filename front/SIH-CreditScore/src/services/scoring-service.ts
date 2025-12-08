import { fetchFromApi } from '@/lib/api';

export interface MLModel {
    modelId: number;
    name: string;
    version: string;
    type: string;
    trainedOn: string;
    metrics: {
        r2?: number;
        rmse?: number;
        status?: string;
        [key: string]: any;
    };
    isActive: boolean;
    artifactPath: string;
}

export interface FlaskModelInfo {
    risk_api: {
        active_version: string;
        versions: {
            v1?: {
                num_models: number;
                num_features: number;
                features: string[];
                metrics: any;
            };
            v2?: {
                num_models: number;
                num_features: number;
                features: string[];
                metrics: any;
            };
        };
    };
    income_api: {
        active_version: string;
        versions: {
            v1?: {
                num_features: number;
                classes: string[];
                features: string[];
                metrics?: any;
            };
            v2?: {
                num_features: number;
                classes: string[];
                features: string[];
                metrics?: any;
            };
        };
    };
}

export interface FlaskHealthStatus {
    risk_api: boolean;
    income_api: boolean;
}

export const scoringService = {
    getAllModels: async (): Promise<MLModel[]> => {
        return fetchFromApi('/ml-models');
    },

    activateModel: async (modelId: number): Promise<void> => {
        return fetchFromApi(`/ml-models/${modelId}/activate`, {
            method: 'POST',
        });
    },

    triggerRetraining: async (): Promise<void> => {
        return fetchFromApi('/ml-models/retrain', {
            method: 'POST',
        });
    },

    // Flask API Management
    getFlaskModelInfo: async (): Promise<FlaskModelInfo> => {
        return fetchFromApi('/ml-models/flask/info');
    },

    checkFlaskHealth: async (): Promise<FlaskHealthStatus> => {
        return fetchFromApi('/ml-models/flask/health');
    },

    switchRiskVersion: async (version: 'v1' | 'v2'): Promise<void> => {
        return fetchFromApi(`/ml-models/flask/risk/switch/${version}`, {
            method: 'POST',
        });
    },

    switchIncomeVersion: async (version: 'v1' | 'v2'): Promise<void> => {
        return fetchFromApi(`/ml-models/flask/income/switch/${version}`, {
            method: 'POST',
        });
    },

    trainCustomModel: async (file: File, priorityConfig: string[]): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('priority_config', JSON.stringify(priorityConfig));

        return fetchFromApi('/ml-models/train', {
            method: 'POST',
            body: formData,
        });
    },
};
