export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId: string | null;
  imageUrl?: string;
  children?: Category[];
}

export interface CategoryCreateData {
  name: string;
  description?: string;
  parentId: string | null;
  imageFile?: File;
}
