import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ReceptionistService } from './receptionist.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public } from '@/common/decorators';

@Public()
@ApiTags('Receptionist')
@ApiBearerAuth()
@Controller('receptionist')
export class ReceptionistController {
  constructor(private readonly receptionistService: ReceptionistService) {}

  @Post()
  @ApiOperation({
    description: 'create receptionist profile',
  })
  async createReceptionistProfile(@CurrentUser('userId') userId: number) {
    return this.receptionistService.createReceptionistProfile(userId);
  }

  @Get()
  findAll() {
    return this.receptionistService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.receptionistService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.receptionistService.update(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.receptionistService.remove(+id);
  }
}
