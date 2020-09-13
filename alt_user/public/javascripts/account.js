const ethapi = 'https://mainnet-api.maticvigil.com/v1.0/contract/0x94d04daebe706ce0e6e982657ce66dd6617cbbc2/balanceOf/';
$(document).ready(function () {
    const internalapi = 'https://atlas.adityavijaykumar.me/app/geteth';
    $.get(internalapi, function (retdata) {
        let account = retdata.ethaddress;
        $.getJSON(ethapi + account, function (retdata) {
            if (retdata.success) {
                balance = retdata.data[0].uint256;
                $('#balance').append((balance / 10000));
            }
        });
    });
    $("#tokens").validate({
        errorElement: 'div',
        errorClass: "toast",
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
                min: 1
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
                required: "Purchase amount value cannot be blank.",
                min: "It should be a minimum of ₹1."
            },
            token2: {
                required: "Please enter the same amount value once again.",
                equalTo: "The amount values don't match!"
            }
        }
    });

});