export interface Book {
  id: number
  title: string;
  author: string;
  cover: string;
  is_sigle_book: boolean
  serie_id: number;
  volume: number
  category: string;
  pages: number;
  language: string;
  library: boolean;
  acquisition_date: string;
  status: string;
  init_date: string;
  finish_date: string;
  current_page: number;
  rating: string;
  version: string;
  comments: string;
}

export interface Serie {
  serie_name: string;
  qty_volumes: number
  library_collection: boolean
  status: string;
  init_date: string;
  finish_date: string;
  rating: string;
}

export interface Collection {
  collection_name: string;
  description: string;
  init_date: string;
  finish_date: string;
}

export interface Quote {
  quote: string;
  page: string;
}


export interface Wishlist {
  book_name: string;
  author: string
  link: string;
  is_sigle_book: boolean
  volume: number
}
