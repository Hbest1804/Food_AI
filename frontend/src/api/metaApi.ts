import axiosClient from './axiosClient';

export interface MetaRegion {
  id: number;
  code: string;
  name: string;
}

export interface MetaCategory {
  id: number;
  name: string;
  slug: string;
}

export interface MetaTag {
  id: number;
  name: string;
}

export interface MetaDietType {
  id: number;
  code: string;
  name: string;
}

export interface MetaAllergenGroup {
  id: number;
  code: string;
  name: string;
}

export interface MetaFiltersResponse {
  success: boolean;
  data: {
    regions: MetaRegion[];
    categories: MetaCategory[];
    tags: MetaTag[];
    diet_types: MetaDietType[];
    allergen_groups: MetaAllergenGroup[];
  };
}

export const metaApi = {
  getFilters: (): Promise<MetaFiltersResponse> => {
    return axiosClient.get('/api/meta/filters');
  },
};
