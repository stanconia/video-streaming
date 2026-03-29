package com.videostreaming.payment.dto;

public class StripeConnectResponse {
    private boolean bankAccountAdded;
    private String bankAccountLast4;
    private String bankAccountHolderName;
    private boolean transfersEnabled;

    public StripeConnectResponse() {}

    public StripeConnectResponse(boolean bankAccountAdded, String bankAccountLast4,
                                  String bankAccountHolderName, boolean transfersEnabled) {
        this.bankAccountAdded = bankAccountAdded;
        this.bankAccountLast4 = bankAccountLast4;
        this.bankAccountHolderName = bankAccountHolderName;
        this.transfersEnabled = transfersEnabled;
    }

    public boolean isBankAccountAdded() { return bankAccountAdded; }
    public void setBankAccountAdded(boolean bankAccountAdded) { this.bankAccountAdded = bankAccountAdded; }

    public String getBankAccountLast4() { return bankAccountLast4; }
    public void setBankAccountLast4(String bankAccountLast4) { this.bankAccountLast4 = bankAccountLast4; }

    public String getBankAccountHolderName() { return bankAccountHolderName; }
    public void setBankAccountHolderName(String bankAccountHolderName) { this.bankAccountHolderName = bankAccountHolderName; }

    public boolean isTransfersEnabled() { return transfersEnabled; }
    public void setTransfersEnabled(boolean transfersEnabled) { this.transfersEnabled = transfersEnabled; }
}
