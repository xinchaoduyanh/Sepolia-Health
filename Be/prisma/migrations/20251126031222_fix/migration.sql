DO $$
BEGIN
    -- 1. Xóa cột meetingUrl (Nếu nó CÒN tồn tại thì mới xóa)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Appointment' AND column_name = 'meetingUrl') THEN
        ALTER TABLE "Appointment" DROP COLUMN "meetingUrl";
    END IF;

    -- 2. Thêm cột hostUrl (Nếu nó CHƯA tồn tại thì mới thêm)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Appointment' AND column_name = 'hostUrl') THEN
        ALTER TABLE "Appointment" ADD COLUMN "hostUrl" TEXT;
    END IF;

    -- 3. Thêm cột joinUrl (Nếu nó CHƯA tồn tại thì mới thêm)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Appointment' AND column_name = 'joinUrl') THEN
        ALTER TABLE "Appointment" ADD COLUMN "joinUrl" TEXT;
    END IF;
END $$;
