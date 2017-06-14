/**
 * Created by Oleh on 09.06.2017.
 */
$(function () {
    /*------------------------------------*/
    $.ajax({
       method: 'Get',
        url: '/deleteTree'
    }).done(function (data) {
        forDelete(data);
    });
    $('#addCompany input[name="name"], #edit input[name="name"]').keypress(function (e) {
        if(e.keyCode == 32) {
            e.preventDefault();
        }
    });
    $('#cancel').click(function () {
        $('#edit').hide();
    });
    $('#type').change(function () {
        var type = $('#type option:selected').val();
        if(type === 'Subsidiary') {
            $('#parent').show();
        }
        else {
            $('#parent').hide();
        }
    });
    /*----------------------------get all company which already established--------------------------*/
    $('#addGet').click(function () {
        $('#addCompany').show();
        $.ajax({
            method: 'GET',
            url: '/addCompany'
        }).done(function (data) {
            window.localStorage.names = data;
            var options = '';
            var len = data.length;
            for (var i=0; i<len; i++) {
                options += '<option value='+ data[i] + '>'+data[i]+'</option>'
            }
            $('#parent').append(options);
        });
    });
    /*-------------------------check company already exist------------------------------*/
    $('#addCompany button[type="submit"]').click(function (e) {
        var names = window.localStorage.names.split(',');
        var newCompany =$('#addCompany input[name="name"]').val();
        var len = names.length;
        for (var i=0; i< len; i++) {
            if(newCompany == names[i]) {
                alert('Company with that name already exists');
                e.preventDefault();
            }
        }
    });
    /*-----------------------delete main company-------------------*/
    $('.Main').click(function () {
        var href = $(this).data('href');
        $.ajax({
            url: href,
            method: 'GET'
        }).done(function (data) {
           forDeleteN(data);
        });
    });
    /*----------------------------delete subsidiary company------------------*/
    $('.Subsidiary').click(function () {
        var href = $(this).data('href');
        $.ajax({
            url: href,
            method: 'GET'
        }).done(function (data) {
            //window.location = 'http://localhost:3000';
            location.reload();
        });
    });

    $('.edit').click(function () {
        var href = $(this).data('href');
        $('#editPost').attr('action', href);
        $.ajax({
          url: href,
            method: 'GET'
        }).done(function (data) {
            $('#edit').show();
            $('#edit input[name="type"]').val(data.type);
            $('#edit input[name="name"]').val(data.name);
            $('#edit input[name="capital"]').val(data.capital);
        });
    });
    $('#getTree').click(function () {
        $.ajax({
           url: '/getTree',
            method: 'GET'
        }).done(function (data) {
            $('#tree').html(data);
        });
    });
    function forDelete(data) {
        if(data != 'end') {
            $.ajax({
               url: '/delete',
               method: 'POST',
                data: {arr: data}
            }).done(function (result) {
                forDelete(result);
            });
        }
        //else window.location = 'http://localhost:3000';
    }
    function forDeleteN(data) {
        if(data != 'end') {
            $.ajax({
                url: '/delete',
                method: 'POST',
                data: {arr: data}
            }).done(function (result) {
                if (data == 'end')
                forDeleteN(result);
            });
        }
        else {
            console.log('here');
            location.reload();
        }
    }
});
