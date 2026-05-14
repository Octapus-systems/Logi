import nodemailer from 'nodemailer';

// Create transporter lazily to ensure env vars are loaded
const getTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');

  if (!user || !pass) {
    console.error('SMTP_USER or SMTP_PASS environment variables are missing!');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
    // Add some timeout settings for serverless environments
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

export async function sendTaskAssignedEmail(
  staffEmail: string,
  staffName: string,
  taskTitle: string,
  activeTaskCount: number
) {
  try {
    const mailOptions = {
      from: `"Octapus Systems" <${process.env.SMTP_USER}>`,
      to: staffEmail,
      subject: `New Task Assigned: ${taskTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>New Task Assigned</h2>
          <p>Hi ${staffName},</p>
          <p>A new task has been assigned to you: <strong>${taskTitle}</strong></p>
          <p>You currently have <strong>${activeTaskCount}</strong> active tasks in your queue.</p>
          <p>Please log in to the Logi dashboard to view the details.</p>
          <br />
          <p>Best regards,<br/>Octapus Systems</p>
        </div>
      `,
    };

    const transporter = getTransporter();
    
    // Optional: Verify connection configuration
    // await transporter.verify(); 

    const info = await transporter.sendMail(mailOptions);
    console.log('Task assigned email sent: %s', info.messageId);
    return true;
  } catch (error: any) {
    console.error('Error sending task assigned email:', error.message || error);
    if (error.code === 'EAUTH') {
      console.error('SMTP Authentication failed. Check SMTP_USER and SMTP_PASS (App Password if using Gmail).');
    }
    return false;
  }
}

export async function sendCheckInEmail(staffName: string, time: Date) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn('ADMIN_EMAIL not set, skipping check-in email');
      return false;
    }

    const timeString = new Date(time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' });

    const mailOptions = {
      from: `"Logi System" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `Staff Check-In: ${staffName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Staff Check-In Notification</h2>
          <p><strong>${staffName}</strong> has checked in at <strong>${timeString} (IST)</strong>.</p>
        </div>
      `,
    };

    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log('Check-in email sent: %s', info.messageId);
    return true;
  } catch (error: any) {
    console.error('Error sending check-in email:', error.message || error);
    return false;
  }
}

export async function sendCheckOutEmail(staffName: string, time: Date) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn('ADMIN_EMAIL not set, skipping check-out email');
      return false;
    }

    const timeString = new Date(time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' });

    const mailOptions = {
      from: `"Logi System" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `Staff Check-Out: ${staffName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Staff Check-Out Notification</h2>
          <p><strong>${staffName}</strong> has checked out at <strong>${timeString} (IST)</strong>.</p>
        </div>
      `,
    };

    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log('Check-out email sent: %s', info.messageId);
    return true;
  } catch (error: any) {
    console.error('Error sending check-out email:', error.message || error);
    return false;
  }
}

export async function sendTaskDoneEmail(
  staffName: string,
  taskTitle: string,
  time: Date
) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn('ADMIN_EMAIL not set, skipping task done email');
      return false;
    }

    const timeString = new Date(time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' });

    const mailOptions = {
      from: `"Logi System" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `Task Completed: ${taskTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Task Completed Notification</h2>
          <p><strong>${staffName}</strong> has marked the following task as Done:</p>
          <p><strong>${taskTitle}</strong></p>
          <p>Completed at: <strong>${timeString} (IST)</strong>.</p>
        </div>
      `,
    };

    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log('Task completed email sent: %s', info.messageId);
    return true;
  } catch (error: any) {
    console.error('Error sending task completed email:', error.message || error);
    return false;
  }
}
