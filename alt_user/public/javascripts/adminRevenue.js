const ethapi = 'https://beta-api.ethvigil.com/v0.1/contract/0x5040e5ea53774f0c5b5c873661449ad4cf425ec9/balanceOf/0xb94960eab249ae05cbdef5c45268c092b0ca15f5';
$(document).ready(function () {
    $.getJSON(ethapi, function (retdata) {
            if (retdata.success) {
                balance = retdata.data[0].uint256;
                $('#balance').append((balance / 10000));
            }
        });
});