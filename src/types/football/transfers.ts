export interface TransferPosition {
  label: string;
  key: string;
}

export interface TransferFee {
  feeText: string;
  localizedFeeText?: string;
  value?: number;
  amountEuroEstimated?: number | null;
}

export interface TransferType {
  text: string;
  localizationKey?: string;
}

export interface NewTransferData {
  name: string;
  playerId: number;
  position: TransferPosition | null;
  transferDate: string; // ISO Date String
  fromClub: string;
  fromClubFullName: string;
  fromClubId: number;
  toClub: string;
  toClubFullName: string;
  toClubId: number;
  fee: TransferFee | null;
  transferType: TransferType;
  contractExtension: boolean;
  onLoan: boolean;
  fromDate: string | null;
  toDate: string | null;
  marketValue: number | null;
}

export interface LatestTransfersResponse {
  transfers: NewTransferData[];
}
