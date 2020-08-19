const ethapi = 'https://beta-api.ethvigil.com/v0.1/contract/0x5040e5ea53774f0c5b5c873661449ad4cf425ec9/balanceOf/';
$(document).ready(function () {
  const internal = 'http://localhost:3000/app/geteth';
  let bookid = window.location.pathname.replace('/app/book/', '');
  const internalapi = 'http://localhost:3000/app/api/book/' + bookid;
  $.get(internal, function (retdata) {
    let account = retdata.ethaddress;
    $.get(internalapi, function (data) {
      let price = data.data.book_rental;
      $.getJSON(ethapi + account, function (retdata) {
        if (retdata.success) {
          balance = retdata.data[0].uint256;
        }
      })
      $('#balance').hide();
      $('#balance2').hide();
      $('#rent').hide();
      $('#getValue').click(function () {
        var days = $("input[name=days]").val();
        if (days > 0) {
          var altcost = (days * price).toFixed(4);
          var inrcost = (days * 1).toFixed(2);
          $('span.altcost').html(altcost);
          $('span.inrcost').html(inrcost);
          $('input[name=token]').val(altcost);
          $('input[name=days2]').val(days);
          $('input#token2').html(altcost);
          if ((altcost * 10000) <= balance) {
            $('#balance').show();
            $('#balance2').hide();
            $('span.balance').html((balance / 10000));
            $('#rent').show();
          } else {
            $('#balance').hide();
            $('#balance2').show();
            $('#rent').hide();
            $('span.balance').html((balance / 10000));
          }
        }
      });
    });
  });
});