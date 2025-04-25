export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parentId: string | null; // matches Rails parent_id
  imageUrl?: string; // matches Rails image_url
  createdAt: string; // matches Rails created_at
  updatedAt: string; // matches Rails updated_at
  children?: Category[];
}

export interface CategoryCreateData {
  name: string;
  description?: string;
  parentId: string | null; // matches Rails parent_id
  imageFile?: File; // matches Rails image_file
}
