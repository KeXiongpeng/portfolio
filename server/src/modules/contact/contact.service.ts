import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../../entities';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private contactRepo: Repository<Contact>,
  ) {}

  async createContact(dto: CreateContactDto) {
    const contact = this.contactRepo.create(dto);
    return this.contactRepo.save(contact);
  }

  async getAllContacts() {
    return this.contactRepo.find({ order: { created_at: 'DESC' } });
  }

  async markAsRead(id: number) {
    await this.contactRepo.update(id, { is_read: true });
    return this.contactRepo.findOne({ where: { id } });
  }
}
