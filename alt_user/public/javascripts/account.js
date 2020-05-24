const ethapi = 'https://beta-api.ethvigil.com/v0.1/contract/0x5ee296ebf2a8fa0e875677453510aa5a16c513dc/balanceOf/';
$(document).ready(function () {
    const internalapi = 'http://localhost:3000/app/geteth';
    $.get(internalapi, function (retdata) {
        let account = retdata.ethaddress;
        $.getJSON(ethapi + account, function (retdata) {
            if (retdata.success) {
                balance = retdata.data[0].uint256;
                $('#balance').append((balance / 10000));
            }
        });
    });
});