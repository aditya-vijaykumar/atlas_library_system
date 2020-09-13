const ethapi = 'https://mainnet-api.maticvigil.com/v1.0/contract/0x94d04daebe706ce0e6e982657ce66dd6617cbbc2/balanceOf/';
$(document).ready(function () {
  const internal = 'https://atlas.adityavijaykumar.me/app/geteth';
  let bookid = window.location.pathname.replace('/app/book/', '');
  const internalapi = 'https://atlas.adityavijaykumar.me/app/api/book/' + bookid;
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
      $('#rental').hide();
      $('#getValue').click(function () {
        var days = $("input[name=days]").val();
        if (days > 0) {
          var altcost = (days * price).toFixed(4);
          var inrcost = (days * 1).toFixed(2);
          $('span.altcost').html(altcost);
          $('span.inrcost').html(inrcost);
          $('input[name=token]').val(altcost);
          var token_parent = $('input[name=token]').parent();
          token_parent.prop("class", "input input--filled");
          $('input[name=days2]').val(days);
          var days_parent = $('input[name=days2]').parent();
          days_parent.prop("class", "input input--filled");
          $('input#token2').html(altcost);
          if ((altcost * 10000) <= balance) {
            $('#balance').show();
            $('#balance2').hide();
            $('span.balance').html((balance / 10000));
            $('#rent').show();
            $('#rental').show();
          } else {
            $('#balance').hide();
            $('#balance2').show();
            $('#rent').hide();
            $('#rental').hide();
            $('span.balance').html((balance / 10000));
          }
        }
      });
    });
  });
});