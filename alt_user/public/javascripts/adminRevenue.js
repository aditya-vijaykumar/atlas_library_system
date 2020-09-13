const ethapi = 'https://mainnet-api.maticvigil.com/v1.0/contract/0x94d04daebe706ce0e6e982657ce66dd6617cbbc2/balanceOf/0xd475d181a3217b84073a5d31762c30fae955c014';
$(document).ready(function () {
    $.getJSON(ethapi, function (retdata) {
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