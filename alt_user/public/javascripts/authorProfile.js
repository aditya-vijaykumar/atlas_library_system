$(document).ready(function () {
    if ($('.display-image').attr('src') == '') {
        $('.display-image').hide();
    }
    function readURL(input) {
        if (input.files && input.files[0]) {
            $('.display-image').show();
            var reader = new FileReader();

            reader.onload = function (e) {
                $('#profilePic').attr('src', e.target.result);
            }

            reader.readAsDataURL(input.files[0]); // convert to base64 string
        }
    }

    $("#profileImage").change(function (event) {
        readURL(this);
    });

    jQuery.validator.addMethod("alphanumeric", function (value, element) {
        return this.optional(element) || /^[\w.]+$/i.test(value);
    }, "Letters, numbers, and underscores only please");

    $("#authorProfile").validate({
        rules: {
            // The key name on the left side is the name attribute
            // of an input field. Validation rules are defined
            // on the right side
            fullName: "required",
            bio: "required",
            username: {
                required: true,
                alphanumeric: true
            }

        },
        // Specify validation error messages
        messages: {
            fullName: "Please enter your Full Name.",
            bio: "Please write a little bit about yourself in the bio field.",
        },
        // Make sure the form is submitted to the destination defined
        // in the "action" attribute of the form when valid
        submitHandler: function (form) {
            form.submit();
        }
    });



})
