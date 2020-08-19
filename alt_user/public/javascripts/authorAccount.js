const ethapi = 'https://beta-api.ethvigil.com/v0.1/contract/0xb94960eab249ae05cbdef5c45268c092b0ca15f5/getAuthorBalance/';
$(document).ready(function () {
    const internalapi = 'http://localhost:3000/app/geteth';
    $.get(internalapi, function (retdata) {
        let account = retdata.ethaddress;
        $.getJSON(ethapi + account, function (retdata) {
            if (retdata.success) {
                balance = retdata.data[0].uint256;
                $('#balance').append((balance / 10000));

                $("#transfer").validate({
                    rules: {
                        ethaddress: {
                            required: true,
                            minlength: 42,
                            maxlength: 42
                        },
                        email: {
                            required: true,
                            email: true
                        },
                        token: {
                            required: true,
                            number: true,
                            max: (balance / 10000),
                            min: 0.01
                        },
                        token2: {
                            required: true,
                            equalTo: "#token"
                        }
                    },
                    messages: {
                        ethaddress: {
                            required: "Ethaddress cannot be blank.",
                            minlength: "A valid ethaddress is 42 characters long.",
                            maxlength: "A valid ethaddress is 42 characters long."
                        },
                        email: {
                            required: "Email cannot be blank.",
                            email: "That is not a valid email id."
                        },
                        token: {
                            required: "Token purchase value cannot be blank.",
                            min: "It should be a minimum of 0.01.",
                            max: "Please enter a value less than or equal to your token balance."
                        },
                        token2: {
                            required: "Please enter the same token value once again.",
                            equalTo: "The token values don't match!"
                        }
                    }
                });

            }
        });
    });
});