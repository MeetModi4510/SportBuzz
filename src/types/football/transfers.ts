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
  playerId: string;
  playerImage?: string;
  position: TransferPosition | null;
  transferDate: string; // ISO Date String
  fromClub: string;
  fromClubFullName: string;
  fromClubId: number;
  fromClubLogo?: string;
  toClub: string;
  toClubFullName: string;
  toClubId: number;
  toClubLogo?: string;
  fee: TransferFee | string | null;
  feeValue?: number;
  transferType: TransferType | string;
  contractExtension: boolean;
  onLoan: boolean;
  fromDate: string | null;
  toDate: string | null;
  marketValue: number | null;
  leagueId?: string | number;
  isPopular?: boolean;
}

export interface LatestTransfersResponse {
  transfers: NewTransferData[];
}
