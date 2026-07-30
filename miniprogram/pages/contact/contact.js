// pages/contact/contact.js
const api = require('../../utils/api');

// 邮箱正则(与后端 class-validator @IsEmail 宽度对齐)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Page({
  data: {
    form: { name: '', email: '', message: '' },
    submitting: false,
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  // 表单校验,返回第一条错误信息;全部通过返回空串
  validate(form) {
    const name = (form.name || '').trim();
    const email = (form.email || '').trim();
    const message = (form.message || '').trim();

    if (!name) return '请输入姓名';
    if (!email) return '请输入邮箱';
    if (!EMAIL_RE.test(email)) return '邮箱格式不正确';
    if (!message) return '请输入留言内容';
    return '';
  },

  async onSubmit() {
    // 防重复点击(按钮 disabled 之外的双保险)
    if (this.data.submitting) return;

    const error = this.validate(this.data.form);
    if (error) {
      wx.showToast({ title: error, icon: 'none' });
      return;
    }

    const { name, email, message } = this.data.form;
    this.setData({ submitting: true });
    try {
      await api.submitContact({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      wx.showToast({ title: '提交成功', icon: 'success' });
      this.setData({ form: { name: '', email: '', message: '' } });
    } catch (e) {
      wx.showToast({ title: e.message || '提交失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
