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

export interface FilterMeta {
  regions: MetaRegion[];
  categories: MetaCategory[];
  tags: MetaTag[];
  diet_types: MetaDietType[];
  allergen_groups: MetaAllergenGroup[];
}

export interface MetaFiltersResponse {
  success: boolean;
  data: FilterMeta;
}

export const metaApi = {
  getFilters: async (): Promise<MetaFiltersResponse> => {
    const res = await axiosClient.get<MetaFiltersResponse>('/api/meta/filters');
    return res.data;
  },
};
