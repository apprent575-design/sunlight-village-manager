import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Booking, Unit, Expense, Language, BookingStatus, User, Subscription } from '../types';
import { format, addDays, parseISO, isAfter, differenceInDays } from 'date-fns';

const generatePdfFromHtml = async (htmlContent: string, fileName: string, isRTL: boolean) => {
  const container = document.createElement('div');
  container.style.position = 'fixed'; 
  container.style.top = '-10000px';
  container.style.left = isRTL ? '0' : '-10000px'; 
  container.style.width = '1200px'; 
  container.style.minHeight = '1600px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';
  container.style.fontFamily = "'Cairo', sans-serif";
  container.style.direction = isRTL ? 'rtl' : 'ltr';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    await document.fonts.ready;
    await new Promise(resolve => setTimeout(resolve, 800));
    const canvas = await html2canvas(container, {
      scale: 2, 
      useCORS: true,
      onclone: (clonedDoc) => {
        const style = clonedDoc.createElement('style');
        style.innerHTML = `* { font-family: 'Cairo', sans-serif !important; letter-spacing: 0px !important; }`;
        clonedDoc.head.appendChild(style);
        const div = clonedDoc.body.querySelector('div');
        if(div) div.style.direction = isRTL ? 'rtl' : 'ltr';
      }
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
    pdf.save(fileName);
  } catch (error) {
    console.error("PDF Generation failed:", error);
    alert("Could not generate PDF.");
  } finally {
    if (document.body.contains(container)) document.body.removeChild(container);
  }
};

export const generateReceipt = async (booking: Booking, unitName: string, lang: Language, t: any) => {
  const isRTL = lang === 'ar';
  
  // Define Labels based on Language
  const labels = isRTL ? {
      title: 'إيصال / فاتورة',
      id: 'رقم المرجع',
      date: 'التاريخ',
      tenantInfo: 'بيانات المستأجر',
      name: 'الاسم',
      phone: 'الهاتف',
      bookingDetails: 'تفاصيل الحجز',
      unit: 'الوحدة',
      duration: 'المدة',
      nights: 'ليال',
      checkIn: 'الدخول',
      checkOut: 'الخروج',
      itemDesc: 'الصنف / الوصف',
      rate: 'السعر (يومي)',
      qty: 'العدد',
      total: 'الإجمالي',
      baseRent: 'الإقامة (الإيجار الأساسي)',
      baseRentDesc: 'إيجار الوحدة بدون رسوم إضافية',
      villageFees: 'رسوم القرية',
      villageFeesDesc: 'رسوم البوابة/القرية الإلزامية اليومية',
      housekeeping: 'خدمة التنظيف',
      housekeepingDesc: 'رسوم خدمة التنظيف والترتيب',
      totalRentalPrice: 'إجمالي سعر الإيجار',
      currency: 'ج.م',
      securityDeposit: 'تأمين (منفصل)',
      depositDesc: 'مسترد عند فحص الخروج',
      notes: 'ملاحظات',
      status: 'حالة الحجز',
      payment: 'حالة الدفع',
      footer: 'شكراً لاختياركم قرية صن لايت.'
  } : {
      title: 'RECEIPT / INVOICE',
      id: 'ID',
      date: 'Date',
      tenantInfo: 'Tenant Information',
      name: 'Name',
      phone: 'Phone',
      bookingDetails: 'Booking Details',
      unit: 'Unit',
      duration: 'Duration',
      nights: 'Nights',
      checkIn: 'Check-in',
      checkOut: 'Check-out',
      itemDesc: 'Item / Description',
      rate: 'Rate (Daily)',
      qty: 'Qty',
      total: 'Total',
      baseRent: 'Accommodation (Base Rent)',
      baseRentDesc: 'Unit rental without fees',
      villageFees: 'Village Fees',
      villageFeesDesc: 'Daily mandatory gate/village fees',
      housekeeping: 'Housekeeping',
      housekeepingDesc: 'Cleaning service fee',
      totalRentalPrice: 'Total Rental Price',
      currency: 'EGP',
      securityDeposit: 'Security Deposit (Separate)',
      depositDesc: 'Refundable upon check-out inspection',
      notes: 'Notes',
      status: 'Booking Status',
      payment: 'Payment',
      footer: 'Thank you for choosing Sunlight Village.'
  };

  // Calculations
  const baseTotal = booking.nightly_rate * booking.nights;
  const villageFeesTotal = (booking.village_fee || 0) * booking.nights;
  const housekeeping = booking.housekeeping_enabled ? (booking.housekeeping_price || 0) : 0;
  const subtotal = baseTotal + villageFeesTotal + housekeeping; 
  const deposit = booking.deposit_enabled ? (booking.deposit_amount || 0) : 0;

  // Translation helpers for statuses
  const statusTrans = t(booking.status.toLowerCase());
  const paymentTrans = t(booking.payment_status.toLowerCase());

  const html = `
    <div style="font-family: 'Cairo', sans-serif; padding: 50px; color: #1f2937; max-width: 900px; margin: 0 auto; background: white; direction: ${isRTL ? 'rtl' : 'ltr'};">
      
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0ea5e9; padding-bottom: 25px; margin-bottom: 35px;">
        <div style="display: flex; flex-direction: column;">
           <h1 style="color: #0284c7; font-size: 36px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">Sunlight Village</h1>
           <p style="color: #000000; font-size: 14px; margin: 5px 0; font-weight: 600;">Premium Property Management</p>
        </div>
        <div style="text-align: ${isRTL ? 'left' : 'right'};">
           <div style="background: #f0f9ff; color: #0369a1; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 20px; display: inline-block; margin-bottom: 10px;">
             ${labels.title}
           </div>
           <p style="color: #000000; font-size: 13px; margin: 2px 0;"><strong>${labels.id}:</strong> #${booking.id.slice(0, 8).toUpperCase()}</p>
           <p style="color: #000000; font-size: 13px; margin: 2px 0;"><strong>${labels.date}:</strong> ${format(new Date(), 'yyyy-MM-dd')}</p>
        </div>
      </div>

      <!-- Info Grid -->
      <div style="display: flex; gap: 40px; margin-bottom: 40px;">
        <div style="flex: 1; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h3 style="font-size: 14px; text-transform: uppercase; color: #000000; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin: 0 0 15px 0; font-weight: 800;">
                ${labels.tenantInfo}
            </h3>
            <div style="font-size: 15px;">
                <p style="margin: 8px 0; display:flex; justify-content:space-between;">
                    <span style="color:#000000; font-weight: 600;">${labels.name}:</span> 
                    <span style="font-weight:bold; color: #111827;">${booking.tenant_name}</span>
                </p>
                <p style="margin: 8px 0; display:flex; justify-content:space-between;">
                    <span style="color:#000000; font-weight: 600;">${labels.phone}:</span> 
                    <span style="font-weight:bold; color: #111827;">${booking.phone}</span>
                </p>
            </div>
        </div>
        <div style="flex: 1; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h3 style="font-size: 14px; text-transform: uppercase; color: #000000; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin: 0 0 15px 0; font-weight: 800;">
                ${labels.bookingDetails}
            </h3>
            <div style="font-size: 15px;">
                <p style="margin: 8px 0; display:flex; justify-content:space-between;">
                    <span style="color:#000000; font-weight: 600;">${labels.unit}:</span> 
                    <span style="font-weight:bold; color: #0369a1;">${unitName}</span>
                </p>
                <p style="margin: 8px 0; display:flex; justify-content:space-between;">
                    <span style="color:#000000; font-weight: 600;">${labels.duration}:</span> 
                    <span style="font-weight:bold; color: #111827;">${booking.nights} ${labels.nights}</span>
                </p>
                <p style="margin: 8px 0; display:flex; justify-content:space-between;">
                    <span style="color:#000000; font-weight: 600;">${labels.checkIn}:</span> 
                    <span style="color: #111827;">${format(new Date(booking.start_date), 'yyyy-MM-dd')}</span>
                </p>
                <p style="margin: 8px 0; display:flex; justify-content:space-between;">
                    <span style="color:#000000; font-weight: 600;">${labels.checkOut}:</span> 
                    <span style="color: #111827;">${format(new Date(booking.end_date), 'yyyy-MM-dd')}</span>
                </p>
            </div>
        </div>
      </div>

      <!-- Financial Table -->
      <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <thead style="background-color: #f1f1f1;">
            <tr>
                <th style="text-align: ${isRTL ? 'right' : 'left'}; padding: 16px; color: #000000; font-weight: 800; text-transform: uppercase; font-size: 12px;">${labels.itemDesc}</th>
                <th style="text-align: center; padding: 16px; color: #000000; font-weight: 800; text-transform: uppercase; font-size: 12px;">${labels.rate}</th>
                <th style="text-align: center; padding: 16px; color: #000000; font-weight: 800; text-transform: uppercase; font-size: 12px;">${labels.qty}</th>
                <th style="text-align: ${isRTL ? 'left' : 'right'}; padding: 16px; color: #000000; font-weight: 800; text-transform: uppercase; font-size: 12px;">${labels.total}</th>
            </tr>
        </thead>
        <tbody style="font-size: 14px;">
            <tr>
                <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; border-${isRTL ? 'left' : 'right'}: 1px solid #f1f5f9;">
                    <strong style="color: #000000;">${labels.baseRent}</strong>
                    <div style="font-size: 11px; color: #000000; margin-top: 2px; font-weight: 600;">${labels.baseRentDesc}</div>
                </td>
                <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: center; border-${isRTL ? 'left' : 'right'}: 1px solid #f1f5f9; color: #000000;">${booking.nightly_rate.toLocaleString()}</td>
                <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: center; border-${isRTL ? 'left' : 'right'}: 1px solid #f1f5f9; color: #000000;">${booking.nights}</td>
                <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: ${isRTL ? 'left' : 'right'}; font-weight: 600; color: #000000;">${baseTotal.toLocaleString()}</td>
            </tr>
            ${booking.village_fee > 0 ? `
            <tr>
                <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; border-${isRTL ? 'left' : 'right'}: 1px solid #f1f5f9;">
                    <strong style="color: #000000;">${labels.villageFees}</strong>
                    <div style="font-size: 11px; color: #000000; margin-top: 2px; font-weight: 600;">${labels.villageFeesDesc}</div>
                </td>
                <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: center; border-${isRTL ? 'left' : 'right'}: 1px solid #f1f5f9; color: #000000;">${booking.village_fee.toLocaleString()}</td>
                <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: center; border-${isRTL ? 'left' : 'right'}: 1px solid #f1f5f9; color: #000000;">${booking.nights}</td>
                <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: ${isRTL ? 'left' : 'right'}; font-weight: 600; color: #000000;">${villageFeesTotal.toLocaleString()}</td>
            </tr>` : ''}
            ${housekeeping > 0 ? `
            <tr>
                <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; border-${isRTL ? 'left' : 'right'}: 1px solid #f1f5f9;">
                    <strong style="color: #000000;">${labels.housekeeping}</strong>
                    <div style="font-size: 11px; color: #000000; margin-top: 2px; font-weight: 600;">${labels.housekeepingDesc}</div>
                </td>
                <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: center; border-${isRTL ? 'left' : 'right'}: 1px solid #f1f5f9; color: #000000;">-</td>
                <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: center; border-${isRTL ? 'left' : 'right'}: 1px solid #f1f5f9; color: #000000;">1</td>
                <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: ${isRTL ? 'left' : 'right'}; font-weight: 600; color: #000000;">${housekeeping.toLocaleString()}</td>
            </tr>` : ''}
        </tbody>
        <tfoot style="background-color: #f8fafc;">
            <tr>
                <td colspan="3" style="padding: 16px; text-align: ${isRTL ? 'left' : 'right'}; font-weight: 800; color: #000000; text-transform: uppercase; font-size: 14px;">${labels.totalRentalPrice}</td>
                <td style="padding: 16px; text-align: ${isRTL ? 'left' : 'right'}; font-weight: 800; font-size: 18px; color: #1e293b;">${booking.total_rental_price.toLocaleString()} ${labels.currency}</td>
            </tr>
        </tfoot>
      </table>

      ${deposit > 0 ? `
      <div style="background-color: #fff7ed; border: 1px solid #fdba74; padding: 20px; border-radius: 12px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 10px;">
             <div style="background:#fed7aa; color:#c2410c; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">!</div>
             <div>
                <span style="font-weight: 800; color: #000000; font-size: 15px;">${labels.securityDeposit}</span>
                <span style="font-size: 12px; color: #000000; display: block; font-weight: 600;">${labels.depositDesc}</span>
             </div>
          </div>
          <span style="font-weight: 800; font-size: 18px; color: #c2410c;">${deposit.toLocaleString()} ${labels.currency}</span>
      </div>` : ''}

      <!-- Footer Status -->
      <div style="display: flex; gap: 20px; justify-content: space-between; align-items: flex-end; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          
          <div style="flex: 1;">
            ${booking.notes ? `
                <h4 style="margin: 0 0 8px 0; font-size: 11px; color: #000000; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">${labels.notes}</h4>
                <p style="margin: 0; font-size: 13px; color: #000000; font-style: italic; background: #f1f5f9; padding: 10px; border-radius: 8px;">${booking.notes}</p>
            ` : ''}
          </div>

          <div style="display: flex; gap: 15px;">
              <div style="text-align: center;">
                 <div style="font-size: 11px; color: #000000; margin-bottom: 4px; text-transform: uppercase; font-weight: 700;">${labels.status}</div>
                 <div style="padding: 6px 16px; border-radius: 20px; background: ${booking.status === 'Confirmed' ? '#dcfce7' : '#fef9c3'}; color: ${booking.status === 'Confirmed' ? '#166534' : '#854d0e'}; font-weight: bold; font-size: 13px;">
                    ${statusTrans}
                 </div>
              </div>
              <div style="text-align: center;">
                 <div style="font-size: 11px; color: #000000; margin-bottom: 4px; text-transform: uppercase; font-weight: 700;">${labels.payment}</div>
                 <div style="padding: 6px 16px; border-radius: 20px; background: ${booking.payment_status === 'Paid' ? '#dcfce7' : '#fee2e2'}; color: ${booking.payment_status === 'Paid' ? '#166534' : '#991b1b'}; font-weight: bold; font-size: 13px;">
                    ${paymentTrans}
                 </div>
              </div>
          </div>
      </div>
      
      <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #000000; font-weight: 600;">
        ${labels.footer}
      </div>

    </div>`;

  await generatePdfFromHtml(html, `Receipt_${booking.tenant_name}.pdf`, isRTL);
};

export const generateOccupancyReport = async (units: Unit[], bookings: Booking[], lang: Language, t: any) => {
    const isRTL = lang === 'ar';
    const reportDate = format(new Date(), 'dd MMMM yyyy');

    const labels = isRTL ? {
        title: 'تقرير الإشغال التفصيلي',
        subtitle: 'بيان تفصيلي للإيجارات والرسوم والهاوس كيبنج',
        generated: 'تاريخ التقرير',
        unit: 'الوحدة',
        tenant: 'المستأجر',
        phone: 'الهاتف',
        dates: 'التواريخ',
        nights: 'ليال',
        baseRent: 'الإيجار الأساسي',
        baseRentDesc: '(بدون رسوم)',
        villageFees: 'رسوم القرية',
        housekeeping: 'هاوس كيبنج',
        grandTotal: 'الإجمالي الكلي',
        status: 'الحالة',
        payment: 'الدفع',
        unitTotal: 'ملخص الوحدة',
        footer: 'تقرير الإشغال - نظام صن لايت'
    } : {
        title: 'Detailed Occupancy Report',
        subtitle: 'Detailed breakdown of rent, fees, and housekeeping',
        generated: 'Report Date',
        unit: 'Unit',
        tenant: 'Tenant',
        phone: 'Phone',
        dates: 'Dates',
        nights: 'Nights',
        baseRent: 'Base Rent',
        baseRentDesc: '(No Fees)',
        villageFees: 'Village Fees',
        housekeeping: 'Housekeeping',
        grandTotal: 'Grand Total',
        status: 'Status',
        payment: 'Payment',
        unitTotal: 'Unit Summary',
        footer: 'Occupancy Report - Sunlight System'
    };

    let contentHtml = '';

    units.forEach(u => {
        const unitBookings = bookings
            .filter(b => b.unit_id === u.id)
            .sort((a,b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
        
        if (unitBookings.length === 0) return;

        // Unit Totals
        let unitBase = 0;
        let unitFees = 0;
        let unitHK = 0;
        let unitGrand = 0;

        const bookingRows = unitBookings.map(b => {
            // Calculations per booking
            const baseRent = b.nightly_rate * b.nights;
            const fees = (b.village_fee || 0) * b.nights;
            const hk = b.housekeeping_enabled ? (b.housekeeping_price || 0) : 0;
            const grand = b.total_rental_price; // Should match sum, using stored value

            // Logic Fix: Include Pending bookings in the summary as they block the calendar/occupancy
            // Only exclude Cancelled bookings
            if (b.status !== BookingStatus.CANCELLED) {
                unitBase += baseRent;
                unitFees += fees;
                unitHK += hk;
                unitGrand += grand;
            }

            const statusColor = b.status === BookingStatus.CONFIRMED ? '#166534' : '#854d0e'; // Green or Brown
            const statusBg = b.status === BookingStatus.CONFIRMED ? '#dcfce7' : '#fef9c3';

            const payStatusBg = b.payment_status === 'Paid' ? '#dcfce7' : '#fee2e2';
            const payStatusColor = b.payment_status === 'Paid' ? '#166534' : '#991b1b';

            return `
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
                <td style="padding: 10px; font-weight: bold; color: #1e293b;">${b.tenant_name}</td>
                <td style="padding: 10px; color: #475569; font-size: 11px;">${b.phone}</td>
                <td style="padding: 10px; color: #334155; font-size: 11px;">${format(new Date(b.start_date), 'yyyy-MM-dd')}<br/>${format(new Date(b.end_date), 'yyyy-MM-dd')}</td>
                <td style="padding: 10px; text-align: center;">${b.nights}</td>
                <td style="padding: 10px; text-align: ${isRTL ? 'left' : 'right'}; font-weight: 600; color: #0284c7;">${baseRent.toLocaleString()}</td>
                <td style="padding: 10px; text-align: ${isRTL ? 'left' : 'right'}; color: #64748b;">${fees.toLocaleString()}</td>
                <td style="padding: 10px; text-align: ${isRTL ? 'left' : 'right'}; color: #d97706;">${hk.toLocaleString()}</td>
                <td style="padding: 10px; text-align: ${isRTL ? 'left' : 'right'}; font-weight: bold; color: #0f172a; background-color: #f8fafc;">${grand.toLocaleString()}</td>
                <td style="padding: 10px; text-align: center;">
                   <span style="font-size: 10px; padding: 2px 8px; border-radius: 12px; background: ${payStatusBg}; color: ${payStatusColor}; font-weight: bold;">
                     ${t(b.payment_status.toLowerCase())}
                   </span>
                </td>
                <td style="padding: 10px; text-align: center;">
                   <span style="font-size: 10px; padding: 2px 8px; border-radius: 12px; background: ${statusBg}; color: ${statusColor}; font-weight: bold;">
                     ${t(b.status.toLowerCase())}
                   </span>
                </td>
            </tr>
        `}).join('');

        // Unit Summary Row
        const summaryRow = `
            <tr style="background-color: #f1f5f9; border-top: 2px solid #cbd5e1; font-weight: bold;">
                <td colspan="4" style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; color: #334155;">${labels.unitTotal}</td>
                <td style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; color: #0284c7;">${unitBase.toLocaleString()}</td>
                <td style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; color: #64748b;">${unitFees.toLocaleString()}</td>
                <td style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; color: #d97706;">${unitHK.toLocaleString()}</td>
                <td style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; color: #0f172a; background-color: #e2e8f0;">${unitGrand.toLocaleString()}</td>
                <td></td>
                <td></td>
            </tr>
        `;

        contentHtml += `
            <div style="margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; page-break-inside: avoid;">
                <div style="background: #e0f2fe; padding: 12px 20px; border-bottom: 1px solid #bae6fd; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: #0369a1; font-size: 16px; font-weight: 800;">${u.name}</h3>
                    <span style="font-size: 12px; color: #0284c7; background: #fff; padding: 2px 8px; font-weight: bold; border-radius: 4px;">${unitBookings.length} Bookings</span>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead style="background: #ffffff; border-bottom: 2px solid #f1f5f9; color: #475569;">
                        <tr>
                            <th style="text-align: ${isRTL ? 'right' : 'left'}; padding: 10px; width: 14%;">${labels.tenant}</th>
                            <th style="text-align: ${isRTL ? 'right' : 'left'}; padding: 10px; width: 8%;">${labels.phone}</th>
                            <th style="text-align: ${isRTL ? 'right' : 'left'}; padding: 10px; width: 10%;">${labels.dates}</th>
                            <th style="text-align: center; padding: 10px; width: 4%;">${labels.nights}</th>
                            <th style="text-align: ${isRTL ? 'left' : 'right'}; padding: 10px; width: 11%;">${labels.baseRent}<br/><span style="font-size:9px; font-weight:normal;">${labels.baseRentDesc}</span></th>
                            <th style="text-align: ${isRTL ? 'left' : 'right'}; padding: 10px; width: 9%;">${labels.villageFees}</th>
                            <th style="text-align: ${isRTL ? 'left' : 'right'}; padding: 10px; width: 9%;">${labels.housekeeping}</th>
                            <th style="text-align: ${isRTL ? 'left' : 'right'}; padding: 10px; width: 12%; background-color: #f8fafc;">${labels.grandTotal}</th>
                            <th style="text-align: center; padding: 10px; width: 11%;">${labels.payment}</th>
                            <th style="text-align: center; padding: 10px; width: 12%;">${labels.status}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bookingRows}
                        ${summaryRow}
                    </tbody>
                </table>
            </div>
        `;
    });

    const html = `
    <div style="font-family: 'Cairo', sans-serif; padding: 40px; direction: ${isRTL ? 'rtl' : 'ltr'}; color: #0f172a;">
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #0284c7; padding-bottom: 20px;">
            <h1 style="color: #0369a1; font-size: 32px; font-weight: 800; margin: 0;">${labels.title}</h1>
            <p style="margin: 5px 0; color: #64748b; font-size: 14px; font-weight: 600;">${labels.subtitle}</p>
            <p style="margin: 5px 0; color: #94a3b8; font-size: 12px;">${labels.generated}: ${reportDate}</p>
        </div>

        ${contentHtml || `<p style="text-align:center; padding: 20px; font-weight:bold;">No bookings found.</p>`}

        <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: 600;">
            ${labels.footer}
        </div>
    </div>
    `;

    await generatePdfFromHtml(html, `Detailed_Occupancy_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`, isRTL);
};

export const generateSubscriptionReceipt = async (user: User, subscription: Subscription, lang: Language, t: any) => {
    const isRTL = lang === 'ar';
    const startDate = parseISO(subscription.start_date);
    const endDate = addDays(startDate, subscription.duration_days);

    const labels = isRTL ? {
        title: 'إيصال اشتراك',
        date: 'التاريخ',
        clientInfo: 'بيانات العميل',
        name: 'الاسم',
        email: 'البريد',
        subDetails: 'تفاصيل الاشتراك',
        duration: 'المدة',
        days: 'أيام',
        start: 'تاريخ البدء',
        end: 'تاريخ الانتهاء',
        amount: 'المبلغ المدفوع',
        currency: 'ج.م',
        status: 'الحالة',
        footer: 'شكراً لاستخدامكم نظام صن لايت.'
    } : {
        title: 'Subscription Receipt',
        date: 'Date',
        clientInfo: 'Client Information',
        name: 'Name',
        email: 'Email',
        subDetails: 'Subscription Details',
        duration: 'Duration',
        days: 'Days',
        start: 'Start Date',
        end: 'End Date',
        amount: 'Amount Paid',
        currency: 'EGP',
        status: 'Status',
        footer: 'Thank you for using Sunlight System.'
    };

    const html = `
    <div style="font-family: 'Cairo', sans-serif; padding: 50px; color: #1f2937; max-width: 900px; margin: 0 auto; background: white; direction: ${isRTL ? 'rtl' : 'ltr'};">
        <div style="text-align: center; border-bottom: 3px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 40px;">
             <h1 style="color: #0284c7; font-size: 32px; font-weight: 800;">Sunlight System</h1>
             <div style="font-size: 18px; color: #64748b; margin-top: 5px; font-weight: bold;">${labels.title}</div>
             <p style="margin-top: 5px; color: #94a3b8; font-size: 12px;">${labels.date}: ${format(new Date(), 'yyyy-MM-dd')}</p>
        </div>

        <div style="background: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div>
                    <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 16px;">${labels.clientInfo}</h3>
                    <p style="margin: 5px 0; color: #334155;"><strong>${labels.name}:</strong> ${user.full_name}</p>
                    <p style="margin: 5px 0; color: #334155;"><strong>${labels.email}:</strong> ${user.email}</p>
                </div>
                 <div style="text-align: ${isRTL ? 'left' : 'right'};">
                    <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 16px;">${labels.subDetails}</h3>
                    <p style="margin: 5px 0; color: #334155;"><strong>${labels.duration}:</strong> ${subscription.duration_days} ${labels.days}</p>
                    <p style="margin: 5px 0; color: #334155;"><strong>${labels.status}:</strong> ${subscription.status}</p>
                </div>
            </div>
             <div style="display: flex; justify-content: space-between; margin-top: 20px; border-top: 1px solid #cbd5e1; padding-top: 20px;">
                <div>
                     <p style="margin: 5px 0; color: #475569; font-size: 12px;">${labels.start}</p>
                     <p style="font-weight: bold; color: #0f172a;">${format(startDate, 'yyyy-MM-dd')}</p>
                </div>
                 <div style="text-align: ${isRTL ? 'left' : 'right'};">
                     <p style="margin: 5px 0; color: #475569; font-size: 12px;">${labels.end}</p>
                     <p style="font-weight: bold; color: #0f172a;">${format(endDate, 'yyyy-MM-dd')}</p>
                </div>
            </div>
        </div>

        <div style="background: #0f172a; color: white; padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold; font-size: 16px;">${labels.amount}</span>
            <span style="font-weight: 800; font-size: 24px;">${subscription.price.toLocaleString()} ${labels.currency}</span>
        </div>

        <div style="margin-top: 50px; text-align: center; color: #94a3b8; font-size: 12px;">
             ${labels.footer}
        </div>
    </div>
    `;

    await generatePdfFromHtml(html, `Subscription_${user.full_name}.pdf`, isRTL);
};

export const generateExpenseReport = async (expenses: Expense[], units: Unit[], lang: Language, t: any) => {
     const isRTL = lang === 'ar';
     const total = expenses.reduce((sum, e) => sum + e.amount, 0);
     
     const labels = isRTL ? {
         title: 'تقرير المصروفات',
         date: 'التاريخ',
         unit: 'الوحدة',
         titleCol: 'العنوان',
         category: 'الفئة',
         amount: 'المبلغ',
         total: 'الإجمالي',
         currency: 'ج.م'
     } : {
         title: 'Expenses Report',
         date: 'Date',
         unit: 'Unit',
         titleCol: 'Title',
         category: 'Category',
         amount: 'Amount',
         total: 'Total',
         currency: 'EGP'
     };

     const rows = expenses.map(e => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px;">${format(new Date(e.date), 'yyyy-MM-dd')}</td>
            <td style="padding: 12px;">${units.find(u => u.id === e.unit_id)?.name || '-'}</td>
            <td style="padding: 12px;">${e.title}</td>
            <td style="padding: 12px;">${e.category}</td>
            <td style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; font-weight: bold; color: #dc2626;">${e.amount.toLocaleString()}</td>
        </tr>
     `).join('');

     const html = `
      <div style="font-family: 'Cairo', sans-serif; padding: 40px; color: #1f2937; direction: ${isRTL ? 'rtl' : 'ltr'};">
         <h1 style="color: #0f172a; font-size: 28px; font-weight: 800; margin-bottom: 10px;">${labels.title}</h1>
         <p style="color: #64748b; margin-bottom: 30px;">${format(new Date(), 'yyyy-MM-dd')}</p>

         <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead style="background: #f1f5f9; color: #475569;">
                <tr>
                    <th style="padding: 12px; text-align: ${isRTL ? 'right' : 'left'};">${labels.date}</th>
                    <th style="padding: 12px; text-align: ${isRTL ? 'right' : 'left'};">${labels.unit}</th>
                    <th style="padding: 12px; text-align: ${isRTL ? 'right' : 'left'};">${labels.titleCol}</th>
                    <th style="padding: 12px; text-align: ${isRTL ? 'right' : 'left'};">${labels.category}</th>
                    <th style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'};">${labels.amount}</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
                <tr style="background: #f8fafc; font-weight: bold;">
                    <td colspan="4" style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'};">${labels.total}</td>
                    <td style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; color: #dc2626;">${total.toLocaleString()} ${labels.currency}</td>
                </tr>
            </tbody>
         </table>
      </div>
     `;
     
     await generatePdfFromHtml(html, `Expenses_Report.pdf`, isRTL);
};

export const generateFinancialReport = async (units: Unit[], bookings: Booking[], expenses: Expense[], lang: Language, t: any) => {
    const isRTL = lang === 'ar';
    
    // Global Calculations
    // CHANGED: Revenue is now calculated purely from nightly_rate * nights, excluding fees/housekeeping.
    const totalRevenue = bookings
        .filter(b => b.status === BookingStatus.CONFIRMED)
        .reduce((sum, b) => sum + (b.nightly_rate * b.nights), 0);
    
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    const labels = isRTL ? {
        title: 'الملخص المالي',
        generated: 'تم الإنشاء',
        summary: 'ملخص عام',
        revenue: 'إجمالي الإيرادات (الإيجار الأساسي)',
        expenses: 'إجمالي المصروفات',
        netProfit: 'صافي الربح',
        details: 'تفاصيل حسب الوحدة',
        unit: 'الوحدة',
        bookings: 'حجوزات',
        unitRev: 'إيراد',
        unitExp: 'مصروفات',
        unitNet: 'صافي',
        currency: 'ج.م'
    } : {
        title: 'Financial Summary Report',
        generated: 'Generated',
        summary: 'Executive Summary',
        revenue: 'Total Revenue (Base Rent)',
        expenses: 'Total Expenses',
        netProfit: 'Net Profit',
        details: 'Details by Unit',
        unit: 'Unit',
        bookings: 'Bookings',
        unitRev: 'Revenue',
        unitExp: 'Expenses',
        unitNet: 'Net',
        currency: 'EGP'
    };

    const unitRows = units.map(u => {
        // Filter bookings and expenses for THIS unit
        const uBookings = bookings.filter(b => b.unit_id === u.id && b.status === BookingStatus.CONFIRMED);
        
        // CHANGED: Revenue per unit is also purely Base Rent.
        const uRev = uBookings.reduce((sum, b) => sum + (b.nightly_rate * b.nights), 0);
        
        const uExpenses = expenses.filter(e => e.unit_id === u.id);
        const uExpTotal = uExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        const uNet = uRev - uExpTotal;
        const netColor = uNet >= 0 ? '#16a34a' : '#dc2626';

        return `
         <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px; font-weight: bold; color: #1e293b;">${u.name}</td>
            <td style="padding: 12px; text-align: center;">${uBookings.length}</td>
            <td style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; color: #166534;">${uRev.toLocaleString()}</td>
            <td style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; color: #dc2626;">${uExpTotal.toLocaleString()}</td>
            <td style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; font-weight: bold; color: ${netColor}; background-color: #f8fafc;">${uNet.toLocaleString()}</td>
         </tr>
        `;
    }).join('');

    const html = `
    <div style="font-family: 'Cairo', sans-serif; padding: 40px; color: #1f2937; direction: ${isRTL ? 'rtl' : 'ltr'};">
         <h1 style="color: #0284c7; font-size: 28px; font-weight: 800; margin-bottom: 5px;">${labels.title}</h1>
         <p style="color: #64748b; margin-bottom: 30px; font-size: 12px;">${labels.generated}: ${format(new Date(), 'yyyy-MM-dd HH:mm')}</p>

         <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
             <h3 style="margin-top: 0; color: #0f172a;">${labels.summary}</h3>
             <div style="display: flex; gap: 20px; justify-content: space-around; margin-top: 20px;">
                <div style="text-align: center;">
                    <div style="font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">${labels.revenue}</div>
                    <div style="font-size: 24px; font-weight: 800; color: #16a34a;">${totalRevenue.toLocaleString()} ${labels.currency}</div>
                </div>
                 <div style="text-align: center;">
                    <div style="font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">${labels.expenses}</div>
                    <div style="font-size: 24px; font-weight: 800; color: #dc2626;">${totalExpenses.toLocaleString()} ${labels.currency}</div>
                </div>
                 <div style="text-align: center;">
                    <div style="font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">${labels.netProfit}</div>
                    <div style="font-size: 24px; font-weight: 800; color: #0284c7;">${netProfit.toLocaleString()} ${labels.currency}</div>
                </div>
             </div>
         </div>

         <h3 style="color: #0f172a; margin-bottom: 15px;">${labels.details}</h3>
         <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead style="background: #f1f5f9; color: #475569;">
                <tr>
                    <th style="padding: 12px; text-align: ${isRTL ? 'right' : 'left'}; width: 25%;">${labels.unit}</th>
                    <th style="padding: 12px; text-align: center; width: 10%;">${labels.bookings}</th>
                    <th style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; width: 20%;">${labels.unitRev}</th>
                    <th style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; width: 20%;">${labels.unitExp}</th>
                    <th style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; width: 25%; background-color: #f8fafc;">${labels.unitNet}</th>
                </tr>
            </thead>
            <tbody>
                ${unitRows}
            </tbody>
         </table>
    </div>
    `;

    await generatePdfFromHtml(html, `Financial_Report.pdf`, isRTL);
};

export const generateAdminReport = async (users: User[], lang: Language, t: any) => {
    const isRTL = lang === 'ar';
    const usersList = users.filter(u => u.role !== 'admin');
    
    const labels = isRTL ? {
        title: 'تقرير المشتركين',
        client: 'العميل',
        email: 'البريد',
        subStatus: 'حالة الاشتراك',
        expiry: 'تاريخ الانتهاء',
        daysLeft: 'أيام متبقية',
        revenue: 'قيمة الاشتراك',
        totalRevenue: 'إجمالي الإيرادات',
        currency: 'ج.م'
    } : {
        title: 'Subscribers Report',
        client: 'Client',
        email: 'Email',
        subStatus: 'Sub Status',
        expiry: 'Expiry Date',
        daysLeft: 'Days Left',
        revenue: 'Sub Price',
        totalRevenue: 'Total Revenue',
        currency: 'EGP'
    };

    let totalRev = 0;

    const rows = usersList.map(u => {
        let status = 'No Sub';
        let expiry = '-';
        let days = 0;
        let price = 0;
        let statusColor = '#94a3b8';

        if (u.subscription) {
            const end = addDays(parseISO(u.subscription.start_date), u.subscription.duration_days);
            expiry = format(end, 'yyyy-MM-dd');
            days = differenceInDays(end, new Date());
            price = u.subscription.price;
            totalRev += price;
            
            if (u.subscription.status === 'paused') {
                status = 'Paused';
                statusColor = '#d97706';
            } else if (days > 0) {
                status = 'Active';
                statusColor = '#16a34a';
            } else {
                status = 'Expired';
                statusColor = '#dc2626';
            }
        }

        return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px;">
                <div style="font-weight: bold; color: #0f172a;">${u.full_name}</div>
                <div style="font-size: 11px; color: #64748b;">${u.email}</div>
            </td>
            <td style="padding: 12px; text-align: center;">
                <span style="color: ${statusColor}; font-weight: bold; font-size: 12px;">${status}</span>
            </td>
            <td style="padding: 12px;">${expiry}</td>
            <td style="padding: 12px; text-align: center; font-weight: bold;">${days > 0 ? days : 0}</td>
            <td style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'};">${price.toLocaleString()}</td>
        </tr>
        `;
    }).join('');

    const html = `
     <div style="font-family: 'Cairo', sans-serif; padding: 40px; color: #1f2937; direction: ${isRTL ? 'rtl' : 'ltr'};">
         <h1 style="color: #4338ca; font-size: 28px; font-weight: 800; margin-bottom: 5px;">${labels.title}</h1>
         <p style="color: #64748b; margin-bottom: 30px;">${format(new Date(), 'yyyy-MM-dd')}</p>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead style="background: #e0e7ff; color: #3730a3;">
                <tr>
                    <th style="padding: 12px; text-align: ${isRTL ? 'right' : 'left'};">${labels.client}</th>
                    <th style="padding: 12px; text-align: center;">${labels.subStatus}</th>
                    <th style="padding: 12px; text-align: ${isRTL ? 'right' : 'left'};">${labels.expiry}</th>
                    <th style="padding: 12px; text-align: center;">${labels.daysLeft}</th>
                    <th style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'};">${labels.revenue}</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
                <tr style="background: #f5f3ff; font-weight: bold;">
                    <td colspan="4" style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; text-transform: uppercase;">${labels.totalRevenue}</td>
                    <td style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; color: #4338ca; font-size: 14px;">${totalRev.toLocaleString()} ${labels.currency}</td>
                </tr>
            </tbody>
         </table>
    </div>
    `;

    await generatePdfFromHtml(html, `Admin_Report.pdf`, isRTL);
};