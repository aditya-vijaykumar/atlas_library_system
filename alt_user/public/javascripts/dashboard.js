const intapi = '<url>/app/getbookid';
const ethapi = 'https://mainnet-api.maticvigil.com/v1.0/contract/<BookAccessContract>/getUserAccess/';
$(document).ready(function () {
    var data;
    $.get(intapi, function (retdata) {
        data = retdata.data;
        console.log(data);
        const account = data[0].ethaddress;
        var count = data.length;
        console.log('count ' + count);
        for (let i = 0; i < count; i++) {
            console.log(data);
            var bookid = data[i].product_id;
            console.log('BOOK ID:' + bookid);
            $.getJSON(ethapi + account + '/' + bookid, function (retdata) {
                console.log(retdata.data[0].bool);
                if (retdata.success) {
                    if (!retdata.data[0].bool) {
                        $('#link' + i).attr("href", "javascript:void(0)");
                        $('#link' + i).attr("class", "btn btn-warning disabled");
                        $('#link' + i).html('Expired');
                    } else {
                        $('#link' + i).attr("class", "btn btn-success");
                        $('#link' + i).html('Active');
                    }
                }
            });
        }
    })
});