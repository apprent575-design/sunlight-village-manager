import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Booking, Unit, Expense, Language, BookingStatus } from '../types';
import { format } from 'date-fns';

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
        // Removed global color: #000000 !important to allow branding colors
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
        <thead style="background-color: #f1f5f9;">
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

// --- NEW EXPENSE REPORT (Detailed Grouping) ---
export const generateExpenseReport = async (expenses: Expense[], units: Unit[], lang: Language, t: any) => {
    const isRTL = lang === 'ar';
    
    const labels = isRTL ? {
        title: 'تقرير المصروفات التفصيلي',
        unknownUnit: 'وحدة غير معروفة',
        date: 'التاريخ',
        expenseTitle: 'العنوان',
        category: 'الفئة',
        amount: 'المبلغ',
        records: 'سجلات',
        unitTotal: 'إجمالي الوحدة',
        grandTotal: 'الإجمالي العام للمصروفات',
        across: 'عبر',
        unitCount: 'وحدة',
        currency: 'ج.م',
        footer: 'نظام إدارة صن لايت • السجلات المالية'
    } : {
        title: 'Detailed Expense Report',
        unknownUnit: 'Unknown Unit',
        date: 'Date',
        expenseTitle: 'Title',
        category: 'Category',
        amount: 'Amount',
        records: 'Records',
        unitTotal: 'Unit Total',
        grandTotal: 'Grand Total Expenses',
        across: 'Across',
        unitCount: 'Unit(s)',
        currency: 'EGP',
        footer: 'Sunlight Village Manager • Financial Records'
    };

    let grandTotal = 0;
    let unitsHtml = '';

    // Get unique unit IDs from the filtered expenses
    const uniqueUnitIds = Array.from(new Set(expenses.map(e => e.unit_id)));

    uniqueUnitIds.forEach(unitId => {
        // Find unit details
        const unit = units.find(u => u.id === unitId);
        const unitName = unit ? unit.name : labels.unknownUnit;
        
        // Filter expenses for this unit
        const unitExpenses = expenses.filter(e => e.unit_id === unitId);
        const unitTotal = unitExpenses.reduce((sum, e) => sum + e.amount, 0);
        grandTotal += unitTotal;

        // Create rows for this unit
        const rows = unitExpenses.map(e => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px; color: #000000;">${format(new Date(e.date), 'yyyy-MM-dd')}</td>
                <td style="padding: 10px; font-weight: 600; color: #1e293b;">${e.title}</td>
                <td style="padding: 10px; color: #000000;">${e.category || '-'}</td>
                <td style="padding: 10px; text-align: ${isRTL ? 'left' : 'right'}; color: #b91c1c; font-family: monospace; font-weight: bold;">${e.amount.toLocaleString()}</td>
            </tr>
        `).join('');

        // Append Unit Section
        unitsHtml += `
            <div style="margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; page-break-inside: avoid;">
                <div style="background: #f8fafc; padding: 12px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 700;">${unitName}</h3>
                    <span style="font-size: 12px; color: #64748b; background: #e2e8f0; padding: 2px 8px; font-weight: bold; rounded-full;">${unitExpenses.length} ${labels.records}</span>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                        <tr style="background: #ffffff; border-bottom: 2px solid #f1f5f9;">
                            <th style="text-align: ${isRTL ? 'right' : 'left'}; padding: 10px; color: #000000; font-size: 11px; text-transform: uppercase; font-weight: 800;">${labels.date}</th>
                            <th style="text-align: ${isRTL ? 'right' : 'left'}; padding: 10px; color: #000000; font-size: 11px; text-transform: uppercase; font-weight: 800;">${labels.expenseTitle}</th>
                            <th style="text-align: ${isRTL ? 'right' : 'left'}; padding: 10px; color: #000000; font-size: 11px; text-transform: uppercase; font-weight: 800;">${labels.category}</th>
                            <th style="text-align: ${isRTL ? 'left' : 'right'}; padding: 10px; color: #000000; font-size: 11px; text-transform: uppercase; font-weight: 800;">${labels.amount}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                    <tfoot>
                        <tr style="background: #fef2f2;">
                            <td colspan="3" style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; font-weight: bold; color: #991b1b;">${labels.unitTotal}</td>
                            <td style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; font-weight: 800; color: #991b1b; font-size: 14px;">${unitTotal.toLocaleString()} ${labels.currency}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    });

    const html = `
      <div style="padding: 40px; font-family: 'Cairo', sans-serif; color: #1e293b; direction: ${isRTL ? 'rtl' : 'ltr'};">
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #0ea5e9; padding-bottom: 20px;">
            <h1 style="color: #0284c7; font-size: 28px; margin: 0; font-weight: 800;">${labels.title}</h1>
            <p style="color: #000000; font-size: 14px; margin-top: 5px; font-weight: 600;">${format(new Date(), 'dd MMMM yyyy, HH:mm')}</p>
        </div>

        ${unitsHtml || `<p style="text-align:center; color:#000000; padding: 20px; font-weight: bold;">${isRTL ? 'لا توجد مصروفات.' : 'No expenses found.'}</p>`}

        ${grandTotal > 0 ? `
        <div style="margin-top: 40px; background: #1e293b; color: white; padding: 20px; rounded-xl; display: flex; justify-content: space-between; align-items: center; page-break-inside: avoid;">
            <div>
                <span style="display: block; font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">${labels.grandTotal}</span>
                <span style="font-size: 12px; opacity: 0.9;">${labels.across} ${uniqueUnitIds.length} ${labels.unitCount}</span>
            </div>
            <div style="font-size: 24px; font-weight: 800;">
                ${grandTotal.toLocaleString()} <span style="font-size: 14px; font-weight: normal;">${labels.currency}</span>
            </div>
        </div>
        ` : ''}

        <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #000000; font-weight: 600;">
            ${labels.footer}
        </div>
      </div>
    `;

    await generatePdfFromHtml(html, `Expense_Report.pdf`, isRTL);
};

// --- NEW DETAILED OCCUPANCY REPORT ---
export const generateOccupancyReport = async (units: Unit[], bookings: Booking[], lang: Language, t: any) => {
    const isRTL = lang === 'ar';
    
    const labels = isRTL ? {
        title: 'تقرير الإشغال',
        subtitle: 'تفصيل للإيجارات، رسوم القرية، وخدمة التنظيف',
        noBookings: 'لا توجد حجوزات.',
        bookingsCount: 'حجوزات',
        tenant: 'المستأجر',
        phone: 'الهاتف',
        dates: 'التواريخ',
        nights: 'ليال',
        totalExcl: 'الإجمالي (بدون الرسوم)',
        villageFees: 'رسوم القرية',
        housekeeping: 'تنظيف',
        totalIncl: 'الإجمالي (شامل)',
        status: 'الحالة',
        unitTotal: 'إجمالي الوحدة (المؤكدة)'
    } : {
        title: 'Occupancy Report',
        subtitle: 'Detailed breakdown of rent, village fees, and housekeeping.',
        noBookings: 'No bookings found.',
        bookingsCount: 'Bookings',
        tenant: 'Tenant',
        phone: 'Phone',
        dates: 'Dates',
        nights: 'Nights',
        totalExcl: 'Total (Excl. Fees)',
        villageFees: 'Village Fees',
        housekeeping: 'Housekeeping',
        totalIncl: 'Total (Incl. Fees)',
        status: 'Status',
        unitTotal: 'Unit Total (Confirmed)'
    };

    let contentHtml = '';
    
    units.forEach(unit => {
        const unitBookings = bookings
            .filter(b => b.unit_id === unit.id)
            .sort((a,b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

        if (unitBookings.length === 0) return; 

        let unitRows = '';
        let totalNights = 0;
        let totalBase = 0; // Total Without Fees
        let totalFees = 0; // Village Fees
        let totalHousekeeping = 0;
        let totalGrand = 0; // Total With Fees

        unitBookings.forEach(b => {
             const statusColor = b.status === BookingStatus.CONFIRMED ? '#166534' : (b.status === BookingStatus.CANCELLED ? '#991b1b' : '#854d0e');
             
             // Calculate Breakdown
             const baseRent = b.nightly_rate * b.nights; // Amount without fees
             const houseKeeping = b.housekeeping_enabled ? (b.housekeeping_price || 0) : 0;
             const villageFees = (b.village_fee || 0) * b.nights;
             const grandTotal = b.total_rental_price;
             
             if (b.status !== BookingStatus.CANCELLED) {
                 totalNights += b.nights;
                 totalBase += baseRent;
                 totalFees += villageFees;
                 totalHousekeeping += houseKeeping;
                 totalGrand += grandTotal;
             }

             const statusText = t(b.status.toLowerCase());

             unitRows += `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                   <td style="padding: 10px; font-weight: bold; color: #1f2937;">${b.tenant_name}</td>
                   <td style="padding: 10px; color: #000000;">${b.phone}</td>
                   <td style="padding: 10px; font-size: 12px; color: #000000;">${format(new Date(b.start_date), 'yyyy-MM-dd')} -> ${format(new Date(b.end_date), 'yyyy-MM-dd')}</td>
                   <td style="padding: 10px; text-align: center; color: #000000;">${b.nights}</td>
                   
                   <td style="padding: 10px; text-align: ${isRTL ? 'left' : 'right'}; color: #0369a1; font-family: monospace; font-weight: 600;">
                     ${baseRent.toLocaleString()}
                   </td>
                   <td style="padding: 10px; text-align: ${isRTL ? 'left' : 'right'}; color: #000000; font-size: 11px;">
                     ${villageFees > 0 ? '+' : ''}${villageFees.toLocaleString()}
                   </td>
                   <td style="padding: 10px; text-align: ${isRTL ? 'left' : 'right'}; color: #d97706; font-size: 11px;">
                     ${houseKeeping > 0 ? '+' + houseKeeping.toLocaleString() : '-'}
                   </td>
                   <td style="padding: 10px; text-align: ${isRTL ? 'left' : 'right'}; font-weight: bold; background-color: #f0f9ff; color: #1f2937;">
                     ${grandTotal.toLocaleString()}
                   </td>

                   <td style="padding: 10px; text-align: ${isRTL ? 'left' : 'right'}; color: ${statusColor}; font-weight: bold; font-size: 11px;">${statusText}</td>
                </tr>`;
        });

        // Add Summary Row
        unitRows += `
            <tr style="background-color: #f3f4f6; font-weight: bold; border-top: 2px solid #d1d5db;">
                <td colspan="3" style="padding: 10px; text-align: ${isRTL ? 'left' : 'right'}; color: #000000;">
                    ${labels.unitTotal}
                </td>
                <td style="padding: 10px; text-align: center; color: #000000;">${totalNights}</td>
                <td style="padding: 10px; text-align: ${isRTL ? 'left' : 'right'}; color: #0369a1;">${totalBase.toLocaleString()}</td>
                <td style="padding: 10px; text-align: ${isRTL ? 'left' : 'right'}; color: #000000;">${totalFees.toLocaleString()}</td>
                <td style="padding: 10px; text-align: ${isRTL ? 'left' : 'right'}; color: #d97706;">${totalHousekeeping.toLocaleString()}</td>
                <td style="padding: 10px; text-align: ${isRTL ? 'left' : 'right'}; background-color: #e0f2fe; color: #0c4a6e;">${totalGrand.toLocaleString()}</td>
                <td></td>
            </tr>
        `;

        contentHtml += `
            <div style="margin-bottom: 40px; page-break-inside: avoid;">
                <h3 style="background:#e0f2fe; padding:12px; margin:0; border:1px solid #bae6fd; display:flex; justify-content:space-between; color: #0369a1; border-radius: 8px 8px 0 0;">
                    <span style="font-weight: bold; font-size: 16px;">${unit.name}</span>
                    <span style="font-size: 12px; font-weight: normal; color: #0284c7;">${unitBookings.length} ${labels.bookingsCount}</span>
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #e5e7eb; border-top:none;">
                    <thead style="background:#f9fafb; color: #374151;"><tr>
                        <th style="padding:10px; text-align:${isRTL?'right':'left'}">${labels.tenant}</th>
                        <th style="padding:10px; text-align:${isRTL?'right':'left'}">${labels.phone}</th>
                        <th style="padding:10px; text-align:${isRTL?'right':'left'}">${labels.dates}</th>
                        <th style="padding:10px; text-align:center">${labels.nights}</th>
                        <th style="padding:10px; text-align:${isRTL?'left':'right'}">${labels.totalExcl}</th>
                        <th style="padding:10px; text-align:${isRTL?'left':'right'}">${labels.villageFees}</th>
                        <th style="padding:10px; text-align:${isRTL?'left':'right'}">${labels.housekeeping}</th>
                        <th style="padding:10px; text-align:${isRTL?'left':'right'}; background-color:#e0f2fe;">${labels.totalIncl}</th>
                        <th style="padding:10px; text-align:${isRTL?'left':'right'}">${labels.status}</th>
                    </tr></thead>
                    <tbody>${unitRows}</tbody>
                </table>
            </div>`;
    });

    const html = `
      <div style="padding: 40px; font-family: 'Cairo', sans-serif; color: #111827; direction: ${isRTL ? 'rtl' : 'ltr'};">
        <h1 style="text-align:center; color:#0284c7; margin-bottom:10px; font-size: 28px; font-weight: 800;">${labels.title}</h1>
        <p style="text-align:center; color:#000000; font-size: 12px; margin-bottom: 40px; font-weight: 600;">${labels.subtitle}</p>
        ${contentHtml || `<p style="text-align:center; padding: 20px; color: #000000; font-weight: bold;">${labels.noBookings}</p>`}
      </div>`;
    await generatePdfFromHtml(html, `Occupancy_Detailed.pdf`, isRTL);
};

// --- NEW DETAILED FINANCIAL REPORT (PROFIT) ---
export const generateFinancialReport = async (units: Unit[], bookings: Booking[], expenses: Expense[], lang: Language, t: any) => {
    const isRTL = lang === 'ar';
    
    const labels = isRTL ? {
        title: 'الملخص المالي والأرباح',
        subtitle: 'الملاحظة: يتم حساب الإيرادات بناءً على سعر الليلة الأساسي فقط. يتم استبعاد رسوم القرية والتنظيف من حسابات الأرباح.',
        unitName: 'اسم الوحدة',
        bookings: 'الحجوزات',
        revenue: 'إيرادات الإيجار (الأساسي)',
        expenses: 'المصروفات',
        netProfit: 'صافي الربح',
        grandTotal: 'الإجمالي العام',
        footer: 'نظام إدارة صن لايت'
    } : {
        title: 'Financial Summary & Profit/Loss',
        subtitle: 'Note: Revenue is calculated based on Base Nightly Rate only. Village Fees and Housekeeping charges are excluded from Profit calculations.',
        unitName: 'Unit Name',
        bookings: 'Bookings',
        revenue: 'Rental Revenue (Base)',
        expenses: 'Expenses',
        netProfit: 'Net Profit',
        grandTotal: 'GRAND TOTAL',
        footer: 'Sunlight Village Manager System'
    };

    let rowsHtml = '';
    let grandRev = 0, grandExp = 0, grandNet = 0;

    units.forEach(unit => {
        const unitBookings = bookings.filter(b => b.unit_id === unit.id && b.status === BookingStatus.CONFIRMED);
        const unitExpenses = expenses.filter(e => e.unit_id === unit.id);

        // Revenue = Base Rate * Nights (Excluding Fees)
        const baseRevenue = unitBookings.reduce((sum, b) => sum + (b.nightly_rate * b.nights), 0);
        
        const expenseTotal = unitExpenses.reduce((sum, e) => sum + e.amount, 0);
        const net = baseRevenue - expenseTotal;

        grandRev += baseRevenue;
        grandExp += expenseTotal;
        grandNet += net;

        // Visual helpers
        const netColor = net >= 0 ? '#166534' : '#991b1b'; // Green or Red
        const netBg = net >= 0 ? '#dcfce7' : '#fee2e2'; // Light Green or Light Red bg for printing

        rowsHtml += `
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px; font-weight: bold; color: #1f2937;">${unit.name}</td>
                <td style="padding: 12px; text-align: center; color: #4b5563;">${unitBookings.length}</td>
                <td style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; color: #047857; font-family: monospace; font-size: 13px; font-weight: 600;">
                    ${baseRevenue.toLocaleString()}
                </td>
                <td style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; color: #b91c1c; font-family: monospace; font-size: 13px; font-weight: 600;">
                    ${expenseTotal.toLocaleString()}
                </td>
                <td style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; font-weight: bold; color: ${netColor}; background-color: ${netBg}; font-family: monospace; font-size: 14px;">
                    ${net.toLocaleString()}
                </td>
            </tr>
        `;
    });

    const html = `
      <div style="padding: 40px; font-family: 'Cairo', sans-serif; color: #111827; direction: ${isRTL ? 'rtl' : 'ltr'};">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
          <h1 style="font-size: 32px; font-weight: 800; color: #0284c7;">Sunlight Village</h1>
          <h2 style="font-size: 20px; color: #4b5563; margin-top: 5px;">${labels.title}</h2>
          <p style="color: #000000; font-size: 12px; margin-top:10px; font-weight: 600;">
             ${format(new Date(), 'yyyy-MM-dd HH:mm')}
          </p>
        </div>
        
        <div style="margin-bottom: 20px; font-size: 12px; color: #000000; background: #fef2f2; padding: 10px; border-radius: 6px; border: 1px solid #fecaca;">
            <strong>${isRTL ? 'تنبيه:' : 'Note:'}</strong> ${labels.subtitle}
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
            <thead style="background-color: #1f2937; color: white;">
                <tr>
                    <th style="padding: 14px; text-align: ${isRTL?'right':'left'}; border-top-${isRTL?'right':'left'}-radius: 8px;">${labels.unitName}</th>
                    <th style="padding: 14px; text-align: center;">${labels.bookings}</th>
                    <th style="padding: 14px; text-align: ${isRTL ? 'left' : 'right'};">${labels.revenue}</th>
                    <th style="padding: 14px; text-align: ${isRTL ? 'left' : 'right'};">${labels.expenses}</th>
                    <th style="padding: 14px; text-align: ${isRTL ? 'left' : 'right'}; border-top-${isRTL?'left':'right'}-radius: 8px;">${labels.netProfit}</th>
                </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
            <tfoot style="background-color: #f3f4f6; font-weight: bold; border-top: 2px solid #374151;">
                <tr>
                    <td style="padding: 16px; font-size: 15px; color: #000000;">${labels.grandTotal}</td>
                    <td style="padding: 16px; text-align: center; color: #000000;">-</td>
                    <td style="padding: 16px; text-align: ${isRTL ? 'left' : 'right'}; color: #047857;">${grandRev.toLocaleString()}</td>
                    <td style="padding: 16px; text-align: ${isRTL ? 'left' : 'right'}; color: #b91c1c;">${grandExp.toLocaleString()}</td>
                    <td style="padding: 16px; text-align: ${isRTL ? 'left' : 'right'}; font-size: 18px; color: ${grandNet >= 0 ? '#166534' : '#991b1b'};">
                        ${grandNet.toLocaleString()}
                    </td>
                </tr>
            </tfoot>
        </table>
        
        <div style="margin-top: 40px; text-align: center; color: #000000; font-size: 11px; font-weight: 600;">
            ${labels.footer}
        </div>
      </div>
    `;
    await generatePdfFromHtml(html, `Financial_Profit_Report_Net.pdf`, isRTL);
};