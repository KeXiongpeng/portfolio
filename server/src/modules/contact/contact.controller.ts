import { Controller, Get, Post, Patch, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api')
export class ContactController {
  constructor(private contactService: ContactService) {}

  @Public()
  @Post('contact')
  createContact(@Body() dto: CreateContactDto) {
    return this.contactService.createContact(dto);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Get('admin/contacts')
  getContacts() {
    return this.contactService.getAllContacts();
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Patch('admin/contacts/:id/read')
  markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.contactService.markAsRead(id);
  }
}
