router.route('/uname')
    .get((req, res) => {
        User.find({}, {
            "username": 1,
            _id: 0
        }).then(function(data) {
            res.send(data)
        })
    });

$('#username').on('blur', function() {
    $.ajax({
        url: '/uname',
        contentType: 'application/json',
        data:{
            username:name
        },
        success: function(data) {
            $.each(data, function(index, element) {
                if ($('#username').val() === element.username) {
                    $("#msg").html('<span class="red"><span class="glyphicon glyphicon-remove"></span>Username already exist, Please choose other name..!!</span>');
                    return false;
                } else if ($('#username').val() == '') {
                    $("#msg").html('<span class="red"><span class="glyphicon glyphicon-remove"></span>Enter Username </span>');
                } else {
                    $("#msg").html('<span class="green"><span class="glyphicon glyphicon-ok"></span>Username Available</span>');

                }
            });
        }
    });
});