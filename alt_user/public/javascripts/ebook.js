$(document).ready(function () {
    $('div.mainbook').hide();
    const ethapi = 'https://beta-api.ethvigil.com/v0.1/contract/0x58c08716a36d33bb25a91161ace368a1c5dafd23/getUserAccess/';
    const internalapi = 'http://localhost:3000/app/geteth'; 
    let bookid = window.location.pathname.replace('/app/ebook/', '');

    $.get(internalapi, function (retdata) {
        let account = retdata.ethaddress;
        $.getJSON(ethapi + account + '/' + bookid, function (retdata) {
            console.log(retdata.data[0].bool);
            if (retdata.success) {
                if (!retdata.data[0].bool) {
                    $('#showbook').attr("onClick", "javascript:void(0)");
                    $('#showbook').attr("class", "btn btn-warning disabled");
                    $('#showbook').html("You don't have access");
                } else {
                    $('#showbook').attr("class", "btn btn-success");
                    $('#showbook').html('Click to load book');
                    $('div.mainbook').show();
                    $('#showbook').hide();
                    setTimeout(intcall, 3000);
                }
            }
        });

    });


    function intcall() {
        const intapi = 'http://localhost:3000/app/altload';
        var location;
        var user_id;
        var callurl = intapi + '/' + bookid;
        console.log('The Book ID is: ' + bookid);
        $.get(callurl, function (retdata) {
            location = retdata.location;
            user_id = retdata.user_id;
            console.log(location);
            console.log(user_id);
            const url = "/static/temp/" + user_id + '/' + location + ".pdf";
            console.log(url);
            $('#loading').hide();
            getPDF(url);
        })
    }
});

function getPDF(url) {
    let pdfDoc = null,
        pageNum = 1,
        pageIsRendering = false,
        pageNumIsPending = null;

    const scale = 1.17,
        canvas = document.querySelector('#pdf-render'),
        ctx = canvas.getContext('2d');

    // Render the page
    const renderPage = num => {
        pageIsRendering = true;

        // Get page
        pdfDoc.getPage(num).then(page => {
            // Set scale
            const viewport = page.getViewport({ scale });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderCtx = {
                canvasContext: ctx,
                viewport
            };

            page.render(renderCtx).promise.then(() => {
                pageIsRendering = false;

                if (pageNumIsPending !== null) {
                    renderPage(pageNumIsPending);
                    pageNumIsPending = null;
                }
            });

            // Output current page
            document.querySelector('#page-num').textContent = num;
        });
    };

    // Check for pages rendering
    const queueRenderPage = num => {
        if (pageIsRendering) {
            pageNumIsPending = num;
        } else {
            renderPage(num);
        }
    };

    // Show Prev Page
    const showPrevPage = () => {
        if (pageNum <= 1) {
            return;
        }
        pageNum--;
        queueRenderPage(pageNum);
    };

    // Show Next Page
    const showNextPage = () => {
        if (pageNum >= pdfDoc.numPages) {
            return;
        }
        pageNum++;
        queueRenderPage(pageNum);
    };

    // Get Document
    pdfjsLib
        .getDocument(url)
        .promise.then(pdfDoc_ => {
            pdfDoc = pdfDoc_;

            document.querySelector('#page-count').textContent = pdfDoc.numPages;

            renderPage(pageNum);
        })
        .catch(err => {
            // Display error
            const div = document.createElement('div');
            div.className = 'error';
            div.appendChild(document.createTextNode(err.message));
            document.querySelector('div.err').insertAdjacentHTML("afterend", div);
            // Remove top bar
            document.querySelector('.top-bar').style.display = 'none';
        });

    // Button Events
    document.querySelector('#prev-page').addEventListener('click', showPrevPage);
    document.querySelector('#next-page').addEventListener('click', showNextPage);
}