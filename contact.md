---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: page
title: Submit form
---

<!-- scripts copied from Shraddha's original -->
<script src="vendor/jquery/jquery-3.2.1.min.js"></script>
<script src="vendor/bootstrap/js/popper.js"></script>
<script src="vendor/bootstrap/js/bootstrap.min.js"></script>
<script src="vendor/select2/select2.min.js"></script>
<script src="vendor/tilt/tilt.jquery.min.js"></script>
<script >
  $('.js-tilt').tilt({
  scale: 1.1
  })
</script>

<script>
$('.contact1-form').on('submit',function(e){
       //optional validation code here
       alert('hi there');
  
        e.preventDefault();
      
        $.ajax({
            url: "https://script.google.com/macros/s/AKfycbyoouz-6mVMOT_eCOVgW6SznUL1sPeIIP5D0V9vh4Sz5p7uNbdk/exec",
            method: "POST",
            dataType: "json",
            data: $(".contact1-form").serialize(),
            success: function(response) {
                
                if(response.result == "success") {
                    $('.contact1-form')[0].reset();
                    alert('Thank you for contacting us.');
                    return true;
                }
                else {
                    alert("Something went wrong. Please try again.")
                }
            },
            error: function() {
                
                alert("Something went wrong. Please try again.")
            }
        })
    });
</script>
<script src="js/main.js"></script>

<table class="heavyborder">
  <tr>
    <td class="noborder"><span class="contact1-form-title">Case/Outbreak Map</span></td>
    <td  class="noborder"><span class="contact1-form-title">Submit a COVID-19 case</span></td>
  </tr>

  <tr>
    <td  class="noborder" valign="top">{% include map.html %}</td>
  </tr>

</table>


