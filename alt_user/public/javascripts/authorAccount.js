const ethapi = 'https://beta-api.ethvigil.com/v0.1/contract/0xb94960eab249ae05cbdef5c45268c092b0ca15f5/getAuthorBalance/';
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