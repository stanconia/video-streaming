package com.videostreaming.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class SetupBankAccountRequest {

    @NotBlank(message = "Account holder name is required")
    private String accountHolderName;

    @NotBlank(message = "Routing number is required")
    @Pattern(regexp = "^\\d{9}$", message = "Routing number must be exactly 9 digits")
    private String routingNumber;

    @NotBlank(message = "Account number is required")
    @Pattern(regexp = "^\\d{4,17}$", message = "Account number must be between 4 and 17 digits")
    private String accountNumber;

    public SetupBankAccountRequest() {}

    public SetupBankAccountRequest(String accountHolderName, String routingNumber, String accountNumber) {
        this.accountHolderName = accountHolderName;
        this.routingNumber = routingNumber;
        this.accountNumber = accountNumber;
    }

    public void validate() {
        if (accountHolderName == null || accountHolderName.isBlank()) {
            throw new IllegalArgumentException("Account holder name is required");
        }
        if (routingNumber == null || !routingNumber.matches("^\\d{9}$")) {
            throw new IllegalArgumentException("Routing number must be exactly 9 digits");
        }
        if (accountNumber == null || !accountNumber.matches("^\\d{4,17}$")) {
            throw new IllegalArgumentException("Account number must be between 4 and 17 digits");
        }
    }

    public String getAccountHolderName() { return accountHolderName; }
    public void setAccountHolderName(String accountHolderName) { this.accountHolderName = accountHolderName; }

    public String getRoutingNumber() { return routingNumber; }
    public void setRoutingNumber(String routingNumber) { this.routingNumber = routingNumber; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }
}
