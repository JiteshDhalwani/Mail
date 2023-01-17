document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#single_email_view').innerHTML = '';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-button').addEventListener('click', function () {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
      .then(response => response.json())
      .then(result => load_mailbox('sent'))
      .catch(error => console.log(error));
  })
}


function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single_email_view').innerHTML = 'block';
  document.querySelector('#single_email_view').innerHTML = '';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      for (let i = 0; i < emails.length; i++) {
        const element = document.createElement('div');
        element.style.border = "2px solid black";
        element.innerHTML = `
          <div style="padding:3px; width:100%;">
            <table style="width:100%;">
              <tr>
                <td style="width:15%; text-align:left;"> <strong> ${emails[i].sender} </strong> </td>
                <td style="width:25%; text-align:left;"> ${emails[i].subject} </td>
                <td style="width:60%; text-align:right;"> ${emails[i].timestamp} </td>
              </tr>
            </table>
          </div>`

        if (emails[i].read === true) {
          element.style.backgroundColor = "white";
        } else {
          element.style.backgroundColor = "rgb(196, 195, 195)";
        }
        element.setAttribute('class', 'mail_list');
        document.querySelector('#emails-view').append(element);
        element.addEventListener('click', function () {
          view_mail(emails[i].id, mailbox),
            fetch(`/emails/${emails[i].id}`, {
              method: 'PUT',
              body: JSON.stringify({
                read: true
              })
            })
        });
      }

    })
}


function view_mail(id, mailbox) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single_email_view').innerHTML = 'block';
  document.querySelector('#single_email_view').innerHTML = '';
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(data => {
      const element = document.createElement('div');
      element.innerHTML = `
    <strong> Sender: </strong> ${data.sender} <br>
    <strong> Recipients: </strong> ${data.recipients} <br>
    <strong> Subject: </strong> ${data.subject} <br>
    <strong> Timestamp: </strong> ${data.timestamp} <br>
    <strong> Body: </strong> ${data.body} <br>
    <strong> Archived: </strong> ${data.archived} <br>`
      document.querySelector('#single_email_view').append(element);
      reply_button = document.createElement('button');
      reply_button.innerHTML = "Reply";
      reply_button.setAttribute('class', 'btn btn-warning');
      document.querySelector('#single_email_view').append(reply_button);
      reply_button.addEventListener('click', () => {
        compose_email();
        document.querySelector('#compose-recipients').value = `${data.sender}`;
        document.querySelector('#compose-subject').value = determine_reply_value();
        function determine_reply_value() {
          subject_value = `${data.subject}`
          if (!subject_value.includes("Re:", 0)) {
            return `Re: ${data.subject}`
          } else {
            return `${data.subject}`
          }
        }
        document.querySelector('#compose-body').value = determine_body_value();
        function determine_body_value() {
          return `On ${data.timestamp} ${data.sender} wrote: ${data.body}`
        }

      })

      if (mailbox === "inbox") {
        archive_button = document.createElement('button');
        archive_button.innerHTML = "Archive";
        archive_button.setAttribute('class', 'btn btn-info');
        document.querySelector('#single_email_view').append(archive_button);
        archive_button.addEventListener('click', () => {
          fetch(`/emails/${data.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: true
            })
          }),
            load_mailbox('inbox');
        })
      } else if (mailbox === "archive") {
        archive_button = document.createElement('button');
        archive_button.innerHTML = "Unarchive";
        archive_button.setAttribute('class', 'btn btn-info');
        document.querySelector('#single_email_view').append(archive_button);
        archive_button.addEventListener('click', () => {
          fetch(`/emails/${data.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: false
            })
          }),
            load_mailbox('inbox');
        })
      }
    })
}
