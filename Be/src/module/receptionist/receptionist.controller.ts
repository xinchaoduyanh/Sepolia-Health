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
import { CreateReceptionistDto } from './dto/create-receptionist.dto';
import { UpdateReceptionistDto } from './dto/update-receptionist.dto';

@Controller('receptionist')
export class ReceptionistController {
  constructor(private readonly receptionistService: ReceptionistService) {}

  @Post()
  create(@Body() createReceptionistDto: CreateReceptionistDto) {
    return this.receptionistService.create(createReceptionistDto);
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
  update(
    @Param('id') id: string,
    @Body() updateReceptionistDto: UpdateReceptionistDto,
  ) {
    return this.receptionistService.update(+id, updateReceptionistDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.receptionistService.remove(+id);
  }
}
