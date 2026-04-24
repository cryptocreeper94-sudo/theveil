export interface Trait {
  traitType: string;
  value: string;
}

export interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  name?: string;
  description?: string;
  image?: string;
  owner?: string;
  traits?: Trait[];
  price?: string;
  collectionId?: string;
}

export interface Collection {
  id: string;
  name: string;
  symbol?: string;
  description?: string;
  image?: string;
  totalSupply?: number;
}

export interface Listing {
  id: string;
  nftId: string;
  seller: string;
  price: string;
  currency: string;
  createdAt: string;
}

export interface Bid {
  id: string;
  nftId: string;
  bidder: string;
  amount: string;
  createdAt: string;
}
