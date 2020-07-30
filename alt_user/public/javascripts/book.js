const ethapi = 'https://beta-api.ethvigil.com/v0.1/contract/0x5ee296ebf2a8fa0e875677453510aa5a16c513dc/balanceOf/';
$(document).ready(function () {
    const internalapi = 'http://localhost:3000/app/geteth';
    $.get(internalapi, function (retdata) {
        let account = retdata.ethaddress;
        $.getJSON(ethapi+account, function(retdata){
            if (retdata.success){
              balance = retdata.data[0].uint256;
              console.log(balance);
            }
          })
          $('#balance').hide();
          $('#balance2').hide();
          $('#rent').hide();
          $('#getValue').click(function(){
              var days = $("input[name=days]").val();
              if(days>0) {
              var altcost = (days*0.01).toFixed(4);
              var inrcost = (days*1).toFixed(2);
              $('span.altcost').html(altcost);
              $('span.inrcost').html(inrcost);
              $('input[name=token]').val(altcost);
              $('input[name=days2]').val(days);
              $('input#token2').html(altcost);
              if((altcost*10000)<=balance) {
                $('#balance').show();
                $('#balance2').hide();
                $('span.balance').html((balance/10000));
                $('#rent').show();
              }else {
                $('#balance').hide();
                $('#balance2').show();
                $('#rent').hide();
                $('span.balance').html((balance/10000));
              }
              }
          });  
    });
});